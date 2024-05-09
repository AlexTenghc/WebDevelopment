// Constants to easily refer to pages
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");
const CONTAINERS = [PROFILE, LOGIN, ROOM];

// Custom validation on the password reset fields
const repeatPassword = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password").value;
  const r = repeatPassword.value;
  return p == r;
}
repeatPassword.addEventListener("input", (event) => {
  if (repeatPasswordMatches()) {
    repeatPassword.setCustomValidity("");
  } else {
    repeatPassword.setCustomValidity("Password doesn't match");
  }
});

// Elements
const chatBoard = document.body.querySelector('.room .chat');
const channelContainer = document.body.querySelector('.room .chat .channel_container');
const threadContainer = document.body.querySelector('.room .thread_container');
const messageContainer = document.body.querySelector('.room .chat .message_container');
const splashContainer = document.body.querySelector('.room .chat .splash_container');
const channelButton = document.body.querySelector('channels');
const messageButton = document.body.querySelector('messages');
const threadButton = document.body.querySelector('thread');
const reaction_list = ['like', 'dislike']

const smallScreen = window.matchMedia("screen and (max-width:480px)");
const largeScreen = window.matchMedia("(min-width:480px)");

function closeReply(){
    let url = new URL(document.URL);
    let channelurl = url.pathname.split('/').slice(0,3).join('/');
    window.location.href = channelurl;
}

function createReactionBar(id, type = 1){
    let url = new URL(document.URL);
    let channelurl = url.pathname.split('/').slice(0,3).join('/');
    let reactions = document.createElement('reaction');

    if(type == 2){
        let emoji = document.createElement('emoji');
        let img = document.createElement('img');
        emoji.addEventListener('click', () => {
            window.location.href = channelurl
        });
        img.setAttribute('src', '/static/icon/back.JPG');
        emoji.appendChild(img);
        reactions.appendChild(emoji);
        reactions.style.gridTemplateColumns = '1fr';
        reactions.style.width = '40px';
        return reactions;
    }

    for(let i = 0; i < reaction_list.length; i++){
        let emoji = document.createElement('emoji');
        emoji.setAttribute('id', id + '_' + i);
        emoji.addEventListener('mouseover', () => {
            getReactions(id, i);
        });

        let img = document.createElement('img');
        img.setAttribute('src', '/static/icon/' + reaction_list[i] + '.JPG');
        emoji.appendChild(img);

        let stats = document.createElement('stats');
        stats.setAttribute('id', 'stats_' + id + '_' + i);
        emoji.appendChild(stats);
        emoji.addEventListener('click', () => {
            postReaction(id, i);
        });
        reactions.appendChild(emoji);
    }

    let emoji = document.createElement('emoji');
    let img = document.createElement('img');

    emoji.addEventListener('click', () => {
        window.location.href = channelurl + '/thread/' + id
    });
    img.setAttribute('src', '/static/icon/reply.JPG');
    emoji.appendChild(img);
    reactions.appendChild(emoji); 

    return reactions;
}

function show(page){
    let url = new URL();
    let urllength = url.pathname.split('/').length;
    channelButton.setAttribute('class', 'tab');
    messageButton.setAttribute('class', 'tab');
    threadButton.setAttribute('class', 'tab');

    if(page == 'channels'){
        channelButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'block';
        messageContainer.style.display = 'none';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'none';
    }
    else if(page == 'messages'){
        messageButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'none';
        messageContainer.style.display = 'flex';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'none';

        if(urllength != 3 && urllength != 5){
            messageContainer.style.display = 'none';
            splashContainer.style.display = 'block';
        }
    }
    else if(page == 'thread'){
        threadButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'none';
        messageContainer.style.display = 'none';
        threadContainer.style.display = 'block';
        splashContainer.style.display = 'none';

        if(urllength != 5){
            threadContainer.style.display = 'none';
            splashContainer.style.display = 'block';
        }
    }
}

function loadPage(history = true){
    let url = new URL(document.URL);
    let path = url.pathname;
    let parse = path.split('/');
    let page = parse[1];
    
    let apikey = localStorage.getItem("hsiangct_belay_auth_key");
  
    if(history){
      window.history.pushState(null, page, url);
    }
  
    if(page == ""){
      if(apikey){
        showcontent(page);
      }
      else{
        window.location.href = '/login';
      }
    }
    else if(page == 'login'){
      if(apikey){
        if(document.referrer){
          window.location.href=document.referrer;
        }
        else{
          window.location.href = '/';
        }
      }
      else{
        showcontent(page);
      }
    }
    else if(page == 'profile' || page == 'channel'){
      if(apikey){
        showcontent(page);
      }
      else{
        window.location.href = '/login';
      }
    }
}

function showcontent(page){
    CONTAINERS.forEach((container) => {container.style.display = 'none';});
  
    if(page == ""){
      showChannel();
    }
    else if(page == 'profile'){
      showProfile();
    }
    else if(page == 'login'){
      showLogin();
    }
    else if(page == "channel"){
        showChannel();
    }
    else{
      return;
    }
}

function showChannel(){
    ROOM.style.display = 'block';

    let url = new URL(document.URL);
    let params = url.pathname.split('/');
    let channel_id = (params.length>=3)?params[2]:null
    let message_id = (params.length==5)?params[4]:null

    let username = document.querySelector('.room .welcomeBack .username');
    username.innerHTML = localStorage.getItem('username');
    
    let profile = document.querySelector('.room .loggedIn');
    profile.addEventListener('click', () => {window.location.href = '/profile';});

    splashContainer.style.display = "block";
    messageContainer.style.display = "none";
    threadContainer.style.display = "none";

    getChannels(channel_id);
    startChannelPolling(channel_id);

    if(channel_id){
        splashContainer.style.display = "none";
        messageContainer.style.display = "flex";

        let displayRoom = document.querySelector('.displayRoomName');
        displayRoom.style.display ='block';

        let editRoomName = document.querySelector('.editRoomName');
        editRoomName.style.display = 'none';

        let editRoomNameButton = document.querySelector('.displayRoomName h3 a');
        editRoomNameButton.addEventListener('click',() => {
            displayRoom.style.display = 'none';
            editRoomName.style.display = 'block';
        })

        let updateChannelName= document.querySelector('.editRoomName button');
        updateChannelName.setAttribute('onclick', 'renameChannel(' + channel_id + ');');

        let postMessage= document.querySelector('.message_container .comment button');
        postMessage.setAttribute('onclick', 'postMessage(' + channel_id + ');');
        getMessage(channel_id);
        startMessagePolling(channel_id);
    }

    if(message_id){
        chatBoard.style.gridTemplateColumns = '1fr 4fr 3fr';
        threadContainer.style.display = 'block';

        if(smallScreen.matches){
            adjustSmall();
        }

        messageContainer.style.borderRight = '5px solid';
        
        let postMessageButton = document.querySelector('.thread_container .comment button');
        postMessageButton.setAttribute('onclick', 'postMessage(' + channel_id + ',' + message_id + ');');

        getReplies(message_id);
        startReplyPolling(message_id);
    }
}

function showProfile(){
    PROFILE.style.display = 'block';
    
    let username = document.querySelector('.profile .welcomeBack .username');
    username.innerHTML = localStorage.getItem('username');

    let exit = document.querySelector('.exit.logout');
    exit.setAttribute('onclick', 'logout();')

    let goHome = document.querySelector('.exit.goToSplash');
    goHome.addEventListener('click', () => {window.location.href = '/';})

    let usernameInput = document.querySelector('.profile input[name=username]');
    usernameInput.value = '';

    let updateUsername = document.querySelector('.updateUsername');
    updateUsername.setAttribute('onclick', 'updateUsername()');
    
    let passwordInput = document.querySelector('.profile input[name=password]');
    passwordInput.value = '';

    let updatePassword= document.querySelector('.updatePassword');
    updatePassword.setAttribute('onclick', 'updatePassword()');

    repeatPassword.value = '';
}

function showLogin(){
    LOGIN.style.display = 'block';
    let fail = document.querySelector('.failed .message');
    fail.style.display = 'none';
  
    let doLogin = document.querySelector('.login button');
    doLogin.setAttribute('onclick', 'login();')
}

function adjustStyle(){
    if(smallScreen.matches){
        adjustSmall();
    }
    else{
        adjustLarge();
    }
}

function adjustSmall(){
    channelButton.setAttribute('class', 'tab');
    messageButton.setAttribute('class', 'tab');
    threadButton.setAttribute('class', 'tab');

    let url = new URL();
    let urllength = url.pathname.split('/').length;
    chatBoard.style.gridTemplateColumns = '1fr';

    if(urllength == 5){
        threadButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'none';
        messageContainer.style.display = 'none';
        threadContainer.style.display = 'block';
        splashContainer.style.display = 'none';
    }

    else if(urllength == 3){
        messageButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'none';
        messageContainer.style.display = 'flex';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'none';
    }

    else{
        channelButton.setAttribute('class', 'tab selected');
        channelContainer.style.display = 'block';
        messageContainer.style.display = 'none';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'none';
    }
}

function adjustLarge(){
    let url = new URL();
    let urllength = url.pathname.split('/').length;

    if(urllength == 5){
        chatBoard.style.gridTemplateColumns = '1fr 4fr 3fr';
        channelContainer.style.display = 'block';
        messageContainer.style.display = 'flex';
        threadContainer.style.display = 'block';
        splashContainer.style.display = 'none';
    }

    else if(urllength == 3){
        chatBoard.style.gridTemplateColumns = '3fr 5fr';
        channelContainer.style.display = 'block';
        messageContainer.style.display = 'flex';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'none';
    }

    else{
        chatBoard.style.gridTemplateColumns = '3fr 5fr';
        channelContainer.style.display = 'block';
        messageContainer.style.display = 'none';
        threadContainer.style.display = 'none';
        splashContainer.style.display = 'block';
    }
}


// TODO:  Handle clicks on the UI elements. 
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

function signup(){
    fetch('/api/signup',{
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
      let id = json["result"]["id"];
      let api_key = json["result"]["api_key"];
      let username = json["result"]["username"];
  
      localStorage.setItem("user_id", id);
      localStorage.setItem("username", username);
      localStorage.setItem("hsiangct_belay_auth_key", api_key);
    })
    .then(() => {
      loadPage(false);
    })
    .catch((e) => {console.log(e)});
  }
  
function logout(){
    localStorage.clear();
    loadPage(false);
}
  
function login(){
    let header = new Headers();
    let username = document.querySelector(".login input[name=username]");
    let password = document.querySelector(".login input[name=password]");
  
    header.append("username", username.value);
    header.append("password", password.value);
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");
  
    fetch('/api/login', {
      method: 'GET',
      headers: header,
    })
    .then((response) =>{
        if(response.status != 200){
            throw new Error("bad request");
        }
        return response.json();
    })
    .then((json) => {
      if(json["result"]["fail"]){
        username.value = "";
        password.value = "";
  
        let message = document.querySelector(".failed .message");
        message.style.display = 'block';
      }
      else{
        let id = json["resilt"]["id"];
        let api_key = json["result"]["api_key"];
        let username = json["result"]["username"];
  
        localStorage.setItem("user_id", id);
        localStorage.setItem("username", username);
        localStorage.setItem("hsiangct_belay_auth_key", api_key);
  
        loadPage(false);
      }
    })
    .catch((e) => {console.log(e)});
}
  
function updateUsername(){
    let new_username = document.querySelector('.profile input[name=username]');
  
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("new_username", new_username.value);
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");
  
    fetch('/api/update_username', {
      method: 'POST',
      headers: header,
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
      if(!json['result']['fail']){
        localStorage.setItem('username', json['result']['username']);
      }
    })
    .then(() => {
      loadPage(false);
    })
    .catch((e) => {console.log(e)});
}
  
function updatePassword(){
    if(!repeatPasswordMatches()){
      alert("Password not match");
      return;
    }
  
    let new_password = document.querySelector('.profile input[name=password]');
  
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("new_password", new_password.value);
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");
  
    fetch('/api/update_password', {
      method: 'POST',
      headers: header,
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
    })
    .then(() => {
      loadPage(false);
    })
    .catch((e) => {console.log(e)});
}
  
function createChannel(){
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");
  
    fetch('/api/create_channel', {
      method: 'POST',
      headers: header,
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
    })
    .then(() => {
      getRooms();
    })
    .catch((e) => {console.log(e)});
}

function getChannels(id=null){
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");

    fetch('/api/get_channel', {
        method: 'GET',
        headers: header
    })
    .then((response) => {
        if(response.status != 200){
          throw new Error("bad request");
        }
        return response.json();
    })
    .then((json) => {
        let channels = json['result']['channels']

        let list = document.querySelector('.channels');
        list.innerHTML = "";

        for(let i = 0; i < channels.length; i++){
            let channel = document.createElement('channel');
            if(channels[i]['id'] == id){
                channel.setAttribute('class', 'current');
            }

            channel.addEventListener('click', () => {
                window.location.href = '/channel/' + channels[i]['id']
            })

            let name = document.createTextNode(channels[i]['name']);
            channel.appendChild(name);

            if(channels[i]['unread_messages'] != 0){
                let unreadMessageContainer = document.createElement('div');
                unreadMessageContainer.setAttribute('class', 'round');

                let span = document.createElement('span');
                span.setAttribute('class', 'unread_messages');
                span.innerHTML = channels[i]['unread_messages']

                unreadMessageContainer.appendChild(span);
                channel.appendChild(unreadMessageContainer);
            }
            list.appendChild(channel);
        }
    })
    .catch((e) => {console.log(e)});
}

function renameChannel(id){
    let new_channelname = document.querySelector(".renameRoomInput");
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Accept", "application/json");
    header.append("Content-Type", "application/json");
    header.append("new_channelname", new_channelname.value);
  
    fetch("/api/rename_channel/" + id, {
      method: 'POST',
      headers: header,
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
      loadPage(false);
    })
    .catch((e) => {console.log(e)});
}
  
function getMessage(id){
    console.log("getmessage");

    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Content-Type", "application/json");
    header.append("Accept", "application/json");
  
    fetch('/api/get_messages/' + id, {
      method: 'GET',
      headers: header,
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
      if(json['result']['fail']){
        return;
      }
      let url = new URL(document.URL);
      let channelUrl = url.pathname.split('/').slice(0,3).join('/');
      
      let roomname = document.body.querySelector('.displayRoomName strong');
      roomname.innerHTML = json['result']['channel_name'];
  
      let messages = json['result']['messages'];
  
      let board = document.body.querySelector(".messages");
      board.innerHTML = "";
  
      for(let i = 0; i < messages.length; i++){
        let message = document.createElement("message");
  
        let author = document.createElement("author");
        author.innerHTML = messages[i]['author'];
        message.appendChild(author);
  
        let content = document.createElement("content");
        let contentText = document.createTextNode(messages[i]['content']);
        content.appendChild(contentText);

        let imgUrls = messages[i]['img_urls'];
        for (let j = 0; j < imgUrls.length; j++){
            let img = document.createElement('img');
            img.setAttribute('src', imgUrls[j]);
            content.appendChild(img);
        }

        message.appendChild(content);
        
        let reaction = createReactionBar(messages[i]['id']);
        message.appendChild(reaction);

        let num = document.createElement('div');
        num.setAttribute('class', 'view-reply');
        num.innerHTML = messages[i]['replies'] + ' replies';
        num.addEventListener('click', () => {
            window.location.href = channelUrl + '/thread/' + messages[i]['id']
        })
        message.appendChild(num);

        board.appendChild(message);
      }
    })
    .catch((e) => {console.log(e)});
}

function getReplies(id){
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Content-Type", "application/json");
    header.append("Accept", "application/json");

    fetch('/api/get_replies/' + id, {
        method: 'GET',
        headers: header,
    })
    .then((response) => {
        if(response.status != 200){
          throw new Error("bad request");
        }
        return response.json();
    })
    .then((json) => {
        if(json['result']['fail']){
            return;
        }

        let replies = json['result']['replies'];
        let message = json['result']['message'];

        let rootMessage = document.body.querySelector(".thread_container message");
        rootMessage.innerHTML = "";
        let author = document.createElement('author');
        author.innerHTML = message['author'];
        rootMessage.appendChild(author);

        let content = document.createElement("content");
        let contentText = document.createTextNode(message['content'])
        content.appendChild(contentText)

        let imgUrls = message['img_urls']
        for (let j = 0; j < imgUrls.length; j++){
            let img = document.createElement('img');
            img.setAttribute('src', imgUrls[j]);
            content.appendChild(img);
        }
        rootMessage.appendChild(content);

        let reaction = createReactionBar(message['id'], 2);
        rootMessage.appendChild(reaction);

        let board = document.body.querySelector('.replies');
        board.innerHTML = "";

        for(let i = 0; i < replies.length; i++){
            let reply = document.createElement('reply');
            let author = document.createElement('author');
            author.innerHTML = replies[i]['author'];
            reply.appendChild(author);

            let content = document.createElement("content");
            let contentText = document.createTextNode(replies[i]['content']);
            content.appendChild(contentText);

            let imgUrls = replies[i]['img_urls'];
            for (let j = 0; j < imgUrls.length; j++){
                let img = document.createElement('img');
                img.setAttribute('src', imgUrls[j]);
                content.appendChild(img);
            }
            reply.appendChild(content);

            let reaction = createReactionBar(replies[i]['id'], 3);
            reply.appendChild(reaction);
            board.appendChild(reply);
        }      
    })
    .catch((e) => {console.log(e)});
}

function getReactions(message_id, emoji_id){
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("Content-Type", "application/json");
    header.append("Accept", "application/json");
    header.append("user_id", localStorage.getItem('user_id'));

    fetch('/api/getReactions/' + message_id + "/" + emoji_id, {
        method: 'GET',
        Headers: header,
    })
    .then((response) => {
        if(response.status != 200){
          throw new Error("bad request");
        }
        return response.json();
    })
    .then((json) => {
        let stats = document.getElementById('stats_' + message_id + '_' + emoji_id);
        stats.innerHTML = "";

        let users = json['result']['users'];
        console.log(users);
        if(users.length == 0){
            let noUser = document.createElement('div');
            noUser.innerHTML = " ";
            stats.appendChild(noUser);
        }

        for(let i = 0; i < users.length; i++){
            let user = document.createElement('div');
            user.innerHTML = users[i];
            stats.appendChild(user);
        }
        return;
    })
    .catch((e) => {console.log(e)});
}

function postMessage(channel_id, message_id = null){
    let header = new Headers();
    header.append("API-Key", localStorage.getItem('hsiangct_belay_auth_key'));
    header.append("user_id", localStorage.getItem('user_id'));
    header.append("Content-Type", "application/json");
    header.append("Accept", "application/json");
  
    const textArea = (message_id)? document.querySelector(".thread_container .comment textarea"): document.querySelector(".message_container .comment textarea");
    const comment = textArea.value;
  
    fetch((message_id)? '/api/post_message/' + channel_id + '/' + message_id: '/api/post_message/' + channel_id, {
      method: 'POST',
      headers: header,
      body: JSON.stringify({
        comment: comment
      })
    })
    .then((response) => {
      if(response.status != 200){
        throw new Error("bad request");
      }
      return response.json();
    })
    .then((json) => {
      textArea.value = "";
    })
    .catch((e) => {console.log(e)});
}



function startMessagePolling(id){
    const message = setInterval(getMessage, 500, id);
    return false;
}

function startReplyPolling(id){
    const reply = setInterval(getReplies, 500, id);
    return false;
}

function startChannelPolling(id){
    const channel = setInterval(getChannels, 1000, id);
    return false;
}

// Load pages 
window.addEventListener("load", loadPage);
window.addEventListener("popstate", (newState) => {console.log(newState); loadPage(false)});

// Responsive styling
smallScreen.addEventListener("change", adjustStyle);
largeScreen.addEventListener("change", adjustStyle);