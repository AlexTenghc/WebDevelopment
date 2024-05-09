INSERT INTO channel (name) VALUES ('First Channel');
INSERT INTO channel (name) VALUES ('Second Channel');
INSERT INTO channel (name) VALUES ('Third Channel');

INSERT INTO message (channel, body, author) VALUES (1, 'Hello World!', 1);
INSERT INTO message (channel, body, author) VALUES (1, 'Hello World!', 2);

INSERT INTO message (channel, body, author) VALUES (2, 'Hello!', 1);
INSERT INTO message (channel, body, author) VALUES (2, 'Hello!', 2);
INSERT INTO message (channel, body, author) VALUES (2, 'Hello!', 1);

INSERT INTO message (channel, body, author) VALUES (3, 'HIHI!', 1);
INSERT INTO message (channel, body, author) VALUES (3, 'HOHO', 2);

INSERT INTO message_reader(message, reader) VALUES (1, 3);
INSERT INTO message_reader(message, reader) VALUES (2, 3);
INSERT INTO message_reader(message, reader) VALUES (3, 3);

INSERT INTO message_reader(message, reader) VALUES (1, 2);
INSERT INTO message_reader(message, reader) VALUES (2, 2);
INSERT INTO message_reader(message, reader) VALUES (4, 2);
INSERT INTO message_reader(message, reader) VALUES (5, 2);
INSERT INTO message_reader(message, reader) VALUES (7, 2);
INSERT INTO message_reader(message, reader) VALUES (8, 2);

INSERT INTO message_reader(message, reader) VALUES (1, 1);
INSERT INTO message_reader(message, reader) VALUES (4, 1);
INSERT INTO message_reader(message, reader) VALUES (5, 1);
INSERT INTO message_reader(message, reader) VALUES (6, 1);
INSERT INTO message_reader(message, reader) VALUES (7, 1);


