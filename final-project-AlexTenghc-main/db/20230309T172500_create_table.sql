CREATE TABLE channel(
    id INTEGER PRIMARY KEY NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE user(
    id INTEGER PRIMARY KEY  NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    api_key VARCHAR NOT NULL
);

CREATE TABLE message(
    id INTEGER PRIMARY KEY NOT NULL,
    channel INTEGER NOT NULL,
    body TEXT,
    author INTEGER NOT NULL,
    reply_to INTEGER DEFAULT NULL,
    FOREIGN KEY(channel) REFERENCES channel(id),
    FOREIGN KEY(reply_to) REFERENCES message(id)
);

CREATE TABLE message_reader(
    id INTEGER PRIMARY KEY NOT NULL,
    message INTEGER NOT NULL,
    reader INTEGER NOT NULL,
    FOREIGN KEY(message) REFERENCES message(id),
    FOREIGN KEY(reader) REFERENCES user(id)
);

CREATE TABLE reaction(
    id INTEGER PRIMARY KEY NOT NULL,
    emoji INTEGER NOT NULL,
    user INTEGER NOT NULL,
    message INTEGER NOT NULL,
    FOREIGN KEY(user) REFERENCES user(id),
    FOREIGN KEY(message) REFERENCES message(id)
);

