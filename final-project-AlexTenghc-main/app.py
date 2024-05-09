import random
import string
import re
import sqlite3
from flask import Flask, g, jsonify, request
from functools import wraps
from datetime import datetime

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)
    
    if db is None:
        db = g._database = sqlite3.connect('db/belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
        
def query_db(query, args = (), one = False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    
    if rows:
        if one:
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into user (username, password, api_key) ' + 
        'values (?, ?, ?) returning id, username, password, api_key',
        (name, password, api_key),
        one=True)
    return u

def valid_api_key(request):
    api_key = request.headers.get('API-Key')
    if api_key and query_db('select * from user where api_key = ?', [api_key], one=True):
        return True
    return False

def extract_img(s: str):
    url_pattern = r'(https?://.*\.(?:png|jpg|jpeg|gif))'
    urls = []
    s = s.split()
    
    for i, x in enumerate(s):
        urls += re.findall(url_pattern, x)
        s[i] = re.sub(url_pattern, '', x)
        
    output = " ".join(s)
    return {'body': output, 'urls': urls}


# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/channel')
@app.route('/channel/<int:channel_id>')
@app.route('/channel/<int:channel_id>/thread/<int:thread_id>')  


def index(channel_id=None, thread_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404


# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/signup', methods=['POST'])
def signup():
    # Create a new user record with a unique ID and generate an API key
    output = {"info":"", "result":{}}
    
    user = new_user()
    
    if user:
        output["info"] = "success"
        output["result"]["username"] = user["username"]
        output["result"]["api_key"] = user["api_key"]
        output['result']['id'] = user['id']
    else:
        output["info"] = "fail"
        
    return jsonify(output)

@app.route('/api/login')
def login():
    output = {"info":"", "result":{}}
    
    username = request.headers.get("username")
    password = request.headers.get("password")
    
    if username and password:
        user = query_db("SELECT * FROM user WHERE username = ? AND password = ?", 
                        [username, password], one = True)
        
        if user:
            output["info"] = "login success"
            output["result"]["id"] = user["id"]
            output["result"]["username"] = user["username"]
            output["result"]["api_key"] = user["api_key"]
            output["result"]["fail"] = False

        else:           
            output["info"] = "login failed"
            output["result"]["fail"] = True
    else:
        output["info"] = "invalid input"
        output["result"]["fail"] = True
    
    return jsonify(output)

@app.route('/api/update_username', methods=['POST'])
def updateUsername():
    output = {"info":"", "result":{}}
    
    new_username = request.headers.get("new_username")
    api_key = request.headers.get("api_key")
    if valid_api_key(request):
        user = query_db("UPDATE user SET username = ? WHERE api_key = ? RETURNING id, username, api_key", 
                        [new_username, api_key], one = True)
        
        if user:
            output["info"] = "update username success"
            output["result"]["id"] = user["id"]
            output["result"]["username"] = user["username"]
            output["result"]["api_key"] = user["api_key"]
            output["result"]["fail"] = False

        else:          
            output["info"] = "update username failed"
            output["result"]["fail"] = True
    else:
        output["info"] = "invalid apikey"
        output["result"]["fail"] = True
        
    return jsonify(output)

@app.route('/api/update_password', methods=['POST'])
def updatePassword():
    output = {"info":"", "result":{}}
    
    new_password = request.headers.get("new_password")
    api_key = request.headers.get("api_key")
    if valid_api_key(request):
        user = query_db("UPDATE user SET password = ? WHERE api_key = ? RETURNING username, api_key", 
                        [new_password, api_key], one=True)
        
        if user:
            output["info"] = "update password success"
        else:           
            output["info"] = "update password failed"
            
    else:
        output["info"] = "invalid apikey"
        
    return jsonify(output)

@app.route('/api/create_channel', methods=['POST'])
def createChannel():
    output = {"info":"", "result":{}}
    
    if valid_api_key(request):       
        name = "New Channel " + "".join(random.choices(string.digits, k=6))
        channel = query_db("INSERT INTO channel (name) VALUES (?) RETURNING id", 
                        [name], one=True)
        output["info"] = "create channel success"
        output["result"]["channels"] = [{'id': channel['id'], 'name':name}]
    else:
        output["info"] = "create channel failed"

    return jsonify(output)

@app.route('/api/get_channel')
def getChannel():
    output = {"info":"", "result":{}}
    
    api_key = request.headers.get('API-Key')
    user = query_db('SELECT id FROM user WHERE api_key = ?',
                    [api_key], one=True)
    
    if user:
        user_id = user['id']
        channels = query_db('SELECT id, name FROM channel')
        
        output['result']['channels'] = [{'id': channel['id'], 'name': channel['name']} for channel in channels]
        
        for i, channel in enumerate(output['result']['channels']):
            channel_id = channel['id']
            
            totalNum = query_db('SELECT COUNT(*) num FROM message WHERE channel = ? AND reply_to is NULL',
                                      [channel_id], one=True)
            read = query_db('SELECT COUNT(*) num FROM message m '
                            'INNER JOIN message_reader mr ON mr.message = m.id '
                            'WHERE m.channel = ? AND m.reply_to is NULL and mr.reader = ?',
                            [channel_id, user_id], one=True)
            
            output['result']['channels'][i]['unread_messages'] = int(totalNum['num']) - int(read['num'])
        output['info'] = 'get room success'
    
    else:
        output['info'] = 'get room failed'
    
    return jsonify(output)

@app.route('/api/rename_channel/<int:channel_id>', methods=['POST'])
def renameChannel(channel_id):
    output = {"info":"", "result":{}}
    
    new_name = request.headers.get("new_channelname")
    if valid_api_key(request):
        channel = query_db("UPDATE channel SET name = ? WHERE id = ? RETURNING name, id", 
                        [new_name, channel_id], one=True)
        
        if channel:
            output["info"] = "rename channel success"
            output["result"]["channel_id"] = channel["id"]
            output["result"]["channel_name"] = channel["name"]
        else:
            output["info"] = "rename channel failed"

    else:
        output["info"] = "invalid apikey"
        
    return jsonify(output)
        

@app.route('/api/get_messages/<int:channel_id>')
def getMessages(channel_id):
    output = {"info":"", "result":{}}
    api_key = request.headers.get('API-Key')
    user = query_db('SELECT id FROM user WHERE api_key = ?',
                    [api_key], one=True)
    
    if user:
        result = query_db('SELECT message.id, message.body, user.username FROM message ' +
                          'INNER JOIN user '+
                          'ON user.id = message.author WHERE message.channel = ? AND message.reply_to is NULL',
                          [channel_id])
        
        output['result']['messages'] = [{'author': row['username'], 'content': extract_img(row['body'])['body'],
                                         'img_urls': extract_img(row['body'])['urls'], 'id': row['id']}
                                        for row in result] if result else []
        
        # count replies
        for i, message in enumerate(output['result']['messages']):
            replies = query_db('SELECT COUNT(*) num FROM message WHERE reply_to = ?',
                               [message['id']], one=True)
            output['result']['messages'][i]['replies'] = replies['num']
            
            result = query_db('SELECt * FROM message_reader WHERE message = ? AND reader = ?',
                              [message['id'], user['id']], one=True)
            
            if result:
                continue
            query_db("INSERT INTO message_reader (message, reader) VALUES (?, ?)",
                     [message['id'], user['id']])
            
        channel = query_db('SELECT name FROM channel WHERE id = ?',
                           [channel_id], one=True)
        output['result']['channel_name'] = channel['name']
        output['result']['fail'] = False
        output['info'] = f'get message from channel{channel_id}success'
        
    else:
        output['info'] = 'invalid api key'
        output['result']['fail'] = True
        
    return jsonify(output)

@app.route('/api/get_replies/<int:message_id>')
def getReplies(message_id):
    output = {"info":"", "result":{}}
    
    if valid_api_key(request):
        result = query_db('SELECT message.id, message.body, user.username FROM message ' +
                          'INNER JOIN user '+
                          'ON user.id = message.author WHERE message.reply_to = ?',
                          [message_id])
        
        output['result']['replies'] = [{'author': row['username'], 'content': extract_img(row['body'])['body'],
                                         'img_urls': extract_img(row['body'])['urls'], 'id': row['id']}
                                        for row in result] if result else []
        
        message = query_db('SELECT message.id, message.body, user.username FROM message ' +
                          'INNER JOIN user '+
                          'ON user.id = message.author WHERE message.id = ?',
                          [message_id], one=True)
        
        output['result']['message'] = {'author': message['username'], 'content': extract_img(message['body'])['body'],
                                         'img_urls': extract_img(message['body'])['urls'], 'id': message['id']}
        
        output['result']['fail'] = False
        output['info'] = 'get replies success'
    
    else:
        output['result']['fail'] = True
        output['info'] = 'invalid api key'
        
    return jsonify(output)

@app.route('/api/getReactions/<int:message_id>/<int:emoji_id>')
def getReaction(message_id, emoji_id):
    output = {"info":"", "result":{}}
    
    if valid_api_key(request):
        users = query_db('SELECT user.username FROM reaction '
                         'INNER JOIN user on user.id = reaction.user '
                         'WHERE message = ? AND emoji = ?;',
                         [message_id, emoji_id])
        
        if users:
            output['result']['users'] = [user['username'] for user in users]
        
        else:
            output['result']['users'] = []
            
        output['info'] = f'Get reactions successed'
        
    else:
        output['info'] = 'invalid api key'
        output['result']['fail'] = True
        
    return jsonify(output)

@app.route('/api/post_message/<int:channel_id>', methods=['POST'])
@app.route('/api/post_message/<int:channel_id>/<int:message_id>', methods=['POST'])       
def postMessage(channel_id, message_id=None):
    output = {"info":"", "result":{}}
    
    if valid_api_key(request):
        user_id = request.headers.get('user_id')
        comment = request.get_json()['comment']
        
        if message_id:
            row = query_db('INSERT INTO message (author, channel, body, reply_to) VALUES (?, ?, ? ,?) RETURNING *',
                           (user_id, channel_id, comment, message_id), one=True)
        else:
            row = query_db('INSERT INTO message (author, channel, body) VALUES (?, ?, ?) RETURNING *',
                           (user_id, channel_id, comment), one=True)
            
        if row:
            output['result']['messages'] = [{'id': row['id'], 'user_id': row['author'],
                                             'room_id': row['channel'], 'body': row['body'],
                                             'reply_to': row['reply_to']}]
            output['result']['fail'] = False
            output['info'] = "post message success"
            
        else:
            output['result']['fail'] = True
    return jsonify(output)

