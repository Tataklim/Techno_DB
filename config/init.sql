create extension if not exists citext;

create UNLOGGED TABLE users
(
    nickname citext PRIMARY KEY,
    fullname citext NOT NULL,
    email    citext UNIQUE,
    about    varchar
);

create UNLOGGED TABLE forum
(
    slug    citext PRIMARY KEY,
    "user"  citext  NOT NULL,
    title   varchar NOT NULL,
    posts   bigint  DEFAULT 0,
    threads integer DEFAULT 0,
    FOREIGN KEY ("user") REFERENCES users (nickname)
);

create UNIQUE INDEX IF NOT EXISTS index_forum_slug ON forum (slug);

create UNLOGGED TABLE thread
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
create INDEX IF NOT EXISTS index_thread_forum ON thread (forum);
create INDEX IF NOT EXISTS index_thread_slug ON thread (slug);

create UNLOGGED TABLE post
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
create INDEX IF NOT EXISTS index_post_thread_id_created ON post (id, created, thread);
create INDEX IF NOT EXISTS index_post_thread_arr_1_id ON post (thread, (arr[1]), id);

create INDEX IF NOT EXISTS index_post_thread_arr ON post (thread, arr);
create INDEX IF NOT EXISTS index_post_forum ON post (forum);

create INDEX IF NOT EXISTS index_post_thread_id_0 ON post (thread, id) WHERE parent = 0;
create INDEX IF NOT EXISTS index_post_thread_id ON post (thread, id);

create UNLOGGED TABLE votes
(
    author citext NOT NULL,
    thread int4   NOT NULL,
    vote   bool   NOT NULL,
    FOREIGN KEY (author) REFERENCES users (nickname),
    FOREIGN KEY (thread) REFERENCES thread (id)
);

create UNIQUE INDEX IF NOT EXISTS index_votes_thread_author ON votes (thread, author);

create UNLOGGED TABLE forum_user
(
    nickname citext COLLATE ucs_basic not null,
    fullname text                     NOT NULL,
    email    text                     NOT NULL,
    about    text,
    forum    citext                   NOT NULL
);

create UNIQUE INDEX IF NOT EXISTS index_forum_user ON forum_user (forum, nickname);

create or replace function post_array() RETURNS trigger AS
$post_array$
begin
    if NEW.parent = 0 then
        NEW.arr = ARRAY [currval('post_id_seq')];
    end IF;
    IF NEW.parent <> 0 THEN
        NEW.arr = NEW.arr || CAST(currval('post_id_seq') as int4);
    END IF;
    UPDATE forum SET posts = posts + 1 WHERE slug = NEW.forum;

    INSERT INTO forum_user (nickname, forum, email, fullname, about)
    SELECT nickname, NEW.forum, email, fullname, about
    FROM users
    WHERE nickname = NEW.author
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$post_array$ LANGUAGE plpgsql;

create trigger post_trigger
    before insert
    on post
    for each row
EXECUTE procedure post_array();


create or replace function update_forum() RETURNS trigger AS
$tread_trigger$
begin
    update forum set threads = threads + 1 where slug = NEW.forum;

    insert into forum_user (nickname, forum, email, fullname, about)
    select nickname, NEW.forum, email, fullname, about
    from users
    where nickname = NEW.author
    ON CONFLICT DO NOTHING;

    return NEW;
end;
$tread_trigger$ LANGUAGE plpgsql;


create trigger thread_trigger
    after insert
    on thread
    for each row
EXECUTE procedure update_forum();


create or replace function insert_vote() RETURNS trigger AS
$tread_trigger$
begin
    if new.vote = true then
        update thread set votes = votes + 1 where id = NEW.thread;
    end if;
    if new.vote = false then
        update thread set votes = votes - 1 where id = NEW.thread;
    end if;

    return NEW;
end;
$tread_trigger$ LANGUAGE plpgsql;

create trigger votes_trigger
    before insert
    on votes
    for each row
EXECUTE procedure insert_vote();

create or replace function change_vote() RETURNS trigger AS
$tread_trigger$
begin
    if new.vote = true then
        update thread set votes = votes + 2 where id = NEW.thread;
    end if;
    if new.vote = false then
        update thread set votes = votes - 2 where id = NEW.thread;
    end if;

    return NEW;
end;
$tread_trigger$ LANGUAGE plpgsql;

create trigger votes_change_trigger
    before update
    on votes
    for each row
EXECUTE procedure change_vote();
