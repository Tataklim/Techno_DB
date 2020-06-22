create extension if not exists citext;

CREATE UNLOGGED TABLE users
(
    nickname citext COLLATE ucs_basic PRIMARY KEY,
    fullname varchar NOT NULL,
    email    citext  NOT NULL UNIQUE,
    about    varchar
);

CREATE UNLOGGED TABLE forum
(
    slug    citext PRIMARY KEY,
    "user"  citext  NOT NULL,
    title   varchar NOT NULL,
    posts   bigint  DEFAULT 0,
    threads integer DEFAULT 0,
    FOREIGN KEY ("user") REFERENCES users (nickname)
);

CREATE UNLOGGED TABLE thread
(
    "id"    SERIAL PRIMARY KEY,
    forum   citext  NOT NULL,
    author  citext  NOT NULL,
    title   varchar NOT NULL,
    message varchar NOT NULL,
    slug    citext UNIQUE,
    created TIMESTAMPTZ DEFAULT now(),
    votes   int4        DEFAULT 0,
    FOREIGN KEY (author) REFERENCES users (nickname),
    FOREIGN KEY (forum) REFERENCES forum (slug)

);

CREATE UNLOGGED TABLE post
(
    id         SERIAL PRIMARY KEY,
    author     citext  NOT NULL,
    created    TIMESTAMPTZ DEFAULT now(),
    forum      citext  NOT NULL,
    "isEdited" BOOLEAN NOT NULL,
    message    varchar NOT NULL,
    parent     int4        DEFAULT 0,
    thread     int4,
    arr        int4[],
    FOREIGN KEY (forum) REFERENCES forum (slug),
    FOREIGN KEY (author) REFERENCES users (nickname),
    FOREIGN KEY (thread) REFERENCES thread (id)
);

CREATE UNLOGGED TABLE votes
(
    author citext NOT NULL,
    thread int4   NOT NULL,
    vote   bool   NOT NULL,
    FOREIGN KEY (author) REFERENCES users (nickname),
    FOREIGN KEY (thread) REFERENCES thread (id)
);

CREATE OR REPLACE FUNCTION post_array() RETURNS trigger AS
$post_array$
DECLARE
    arr int4[];
BEGIN
    IF NEW.parent = 0 THEN
        NEW.arr = ARRAY [currval('post_id_seq')];
    END IF;
    IF NEW.parent <> 0 THEN
        arr := (SELECT post.arr from post where post.id = NEW.parent);
        NEW.arr = arr || CAST(currval('post_id_seq') as int4);
    END IF;
    UPDATE forum SET posts = posts + 1 WHERE slug = NEW.forum;
    RETURN NEW;
END;
$post_array$ LANGUAGE plpgsql;

CREATE TRIGGER post_trigger
    before INSERT
    ON post
    FOR EACH ROW
EXECUTE PROCEDURE post_array();


CREATE OR REPLACE FUNCTION update_forum() RETURNS trigger AS
$tread_trigger$
BEGIN
    UPDATE forum SET threads = threads + 1 where slug = NEW.forum;
    RETURN NEW;
END;
$tread_trigger$ LANGUAGE plpgsql;


CREATE TRIGGER thread_trigger
    after INSERT
    ON thread
    FOR EACH ROW
EXECUTE PROCEDURE update_forum();


CREATE OR REPLACE FUNCTION insert_vote() RETURNS trigger AS
$tread_trigger$
BEGIN
    if new.vote = true then
        UPDATE thread SET votes = votes + 1 where id = NEW.thread;
    end if;
    if new.vote = false then
        UPDATE thread SET votes = votes - 1 where id = NEW.thread;
    end if;

    RETURN NEW;
END;
$tread_trigger$ LANGUAGE plpgsql;

CREATE TRIGGER votes_trigger
    before INSERT
    ON votes
    FOR EACH ROW
EXECUTE PROCEDURE insert_vote();

CREATE OR REPLACE FUNCTION change_vote() RETURNS trigger AS
$tread_trigger$
BEGIN
    if new.vote = true then
        UPDATE thread SET votes = votes + 2 where id = NEW.thread;
    end if;
    if new.vote = false then
        UPDATE thread SET votes = votes - 2 where id = NEW.thread;
    end if;

    RETURN NEW;
END;
$tread_trigger$ LANGUAGE plpgsql;

CREATE TRIGGER votes_change_trigger
    before UPDATE
    ON votes
    FOR EACH ROW
EXECUTE PROCEDURE change_vote();

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_slug  ON forum (slug);

CREATE INDEX IF NOT EXISTS idx_threads_slug ON thread (slug);
CREATE INDEX IF NOT EXISTS idx_threads_forum ON thread (forum);

CREATE INDEX IF NOT EXISTS idx_posts_forum ON post (forum);
CREATE INDEX IF NOT EXISTS idx_posts_thread_path ON post (thread, arr);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON post (thread, id);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id0 ON post (thread, id) WHERE parent = 0;
CREATE INDEX IF NOT EXISTS idx_posts_thread_id_created ON post (id, created, thread);
CREATE INDEX IF NOT EXISTS idx_posts_thread_path1_id ON post (thread, (arr[1]), id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_thread_nickname ON votes (thread, author);
