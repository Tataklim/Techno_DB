import {query} from '../repository_helper/repository_helper.js';
import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';
import UserRepository from '../user/repository.js';
import ForumRepository from '../forum/repository.js';

/**
 * kek
 */
export default class ThreadRepository {
    /**
     * Constructor
     * @param {Object} pool
     * @param {Object} sql
     */
    constructor(pool, sql) {
        this.pool = pool;
        this.sql = sql;
        this.userRepository = new UserRepository(pool, sql);
        this.forumRepository = new ForumRepository(pool, sql);
    }

    /**
     * Thread creation
     * @param {Object} thread
     * @return {Object}
     */
    async createThread(thread) {
        if (thread.slug !== undefined) {
            const duplication = await this._getThreadBySlug(thread);
            if (duplication !== false) {
                return responseModel(STATUSES.DUPLICATION, duplication);
            }
        }
        const user = await this.userRepository.getUser({nickname: thread.author.toLowerCase()});
        if (user.type === STATUSES.NOT_FOUND) {
            return responseModel(STATUSES.NOT_FOUND, 'Cant find user');
        }
        thread.author = user.body.nickname;
        const forum = await this.forumRepository.getForum({slug: thread.forum});
        if (forum.type === STATUSES.NOT_FOUND) {
            return responseModel(STATUSES.NOT_FOUND, 'Cant find forum');
        }
        thread.forum = forum.body.slug;
        const res = await this._createThread(thread);
        if (res === false) {
            return responseModel(STATUSES.NOT_FOUND, 'Cant find user');
        }
        thread.id = res.id;
        return responseModel(STATUSES.SUCCESS, thread);
    }

    /**
     * Thread creation
     * @param {String} thread
     * @param {String} message
     * @param {String} title
     * @return {Object}
     */
    async updateThread(thread, message, title) {
        let checkThread = {};
        if (this.isInt(thread)) {
            checkThread = await this.getThread({id: thread});
        } else {
            checkThread = await this.getThread({slug: thread});
        }
        if (checkThread.type === STATUSES.NOT_FOUND) {
            return checkThread;
        }
        thread = checkThread.body.id;
        return await this._updateThread(thread, message, title, checkThread.body);
    }

    /**
     * Thread creation
     * @param {Object} thread
     * @return {Object}
     */
    async getThread(thread) {
        let res = {};
        if (thread.id === undefined) {
            res = await this._getThreadBySlug(thread);
        } else {
            res = await this._getThreadByID(thread);
        }
        if (res === false) {
            return responseModel(STATUSES.NOT_FOUND, 'There isnt thread with this data');
        }
        return responseModel(STATUSES.SUCCESS, res);
    }

    /**
     * Thread creation
     * @param {Object} thread
     * @return {Object}
     */
    async getThreadIDForum(thread) {
        let res;
        if (thread.id === undefined) {
            res = await this._getThreadIDForumBySlug(thread);
        } else {
            res = await this._getThreadIDForumByID(thread);
        }
        if (res === false) {
            return responseModel(STATUSES.NOT_FOUND, 'There isnt thread with this data');
        }
        return responseModel(STATUSES.SUCCESS, res);
    }

    /** Get slug list
     * @param {String} slug
     * @param {Object} params
     */
    async getThreadList(slug, params) {
        const check = await this.forumRepository.getForum({slug: slug});
        if (check.type === STATUSES.NOT_FOUND) {
            return check;
        }
        let str = 'SELECT * from thread where forum = $1 ';
        const arr = [
            slug,
        ];
        if (params.since !== undefined) {
            str += 'and created >= $2 ';
            arr.push(params.since);
            if (params.desc) {
                str = str.replace('>=', '<=');
            }
        }
        str += 'order by created ';
        if (params.desc) {
            str += 'desc ';
        }
        if (params.limit) {
            str += 'limit ' + params.limit;
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
    }


    /**
     * Thread creation
     * @param {String} thread
     * @param {String} message
     * @param {String} title
     * @param {Object} threadData
     * @return {Object}
     */
    async _updateThread(thread, message, title, threadData) {
        if (message === undefined && title === undefined) {
            return responseModel(STATUSES.SUCCESS, threadData);
        }
        let str = 'update thread set';
        const arr = [];
        if (message !== undefined) {
            str += ' message = $1';
            arr.push(message);
            if (title !== undefined) {
                str += ' , title = $2';
                arr.push(title);
            }
        } else {
            str += ' title = $1';
            arr.push(title);
        }
        str += ' where id = $' + (arr.length + 1);
        arr.push(thread);
        str += ' returning id, forum, author, title, message, slug, created, votes';
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows[0]);
    }

    /**
     * Check if exists by slug
     * @param {Object} thread
     * @return {Object}
     */
    async _getThreadBySlug(thread) {

        // const str = 'SELECT id, forum, author, title, message, slug, created, votes FROM thread WHERE slug = $1';
        //
        // const res = await query(this.pool, str, [
        //     thread.slug.toLowerCase(),
        // ]);
        const res = await this.sql`SELECT id, forum, author, title, message, slug, created, votes FROM thread WHERE slug = ${thread.slug.toLowerCase()}`
        // return res.rowCount === 0 ? false : res.rows[0];
        return res.count === 0 ?  false: res[0]
    }

    /**
     * Check if exists by slug
     * @param {Object} thread
     * @return {Object}
     */
    async _getThreadIDForumBySlug(thread) {
        // const str = 'SELECT id, forum FROM thread WHERE slug = $1';
        // const res = await query(this.pool, str, [
        //     thread.slug.toLowerCase(),
        // ]);
        // return res.rowCount === 0 ? false : res.rows[0];

        const res = await this.sql`SELECT id, forum FROM thread WHERE slug = ${thread.slug.toLowerCase()}`
        return res.count === 0 ?  false: res[0]
    }

    /**
     * Check if exists by id
     * @param {Object} thread
     * @return {Object}
     */
    async _getThreadByID(thread) {
        if (thread.id === undefined) {
            return false;
        }
        const str = 'SELECT id, forum, author, title, message, slug, created, votes FROM thread WHERE id = $1';
        const res = await query(this.pool, str, [
            thread.id,
        ]);
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * Check if exists by id
     * @param {Object} thread
     * @return {Object}
     */
    async _getThreadIDForumByID(thread) {
        // const str = 'SELECT id, forum FROM thread WHERE id = $1';
        // const res = await query(this.pool, str, [
        //     thread.id,
        // ]);
        // return res.rowCount === 0 ? false : res.rows[0];

        const res = await this.sql`SELECT id, forum FROM thread WHERE id = ${thread.id}`
        return res.count === 0 ?  false: res[0]
    }


    /**
     * Check if exists by id
     * @param {Object} thread
     * @return {Object}
     */
    async _createThread(thread) {
        let str = 'INSERT INTO thread(author, title, message, forum';
        const array = [
            thread.author,
            thread.title,
            thread.message,
            thread.forum,
        ];
        if (thread.slug !== undefined) {
            str += ', slug';
            array.push(thread.slug);
        }
        if (thread.created !== undefined) {
            str += ', created';
            array.push(thread.created);
        }
        if (thread.votes !== undefined) {
            str += ', votes';
            array.push(thread.votes);
        }
        str += ') VALUES (';
        const len = array.length;
        for (let i = 1; i < len; i++) {
            str += `$${i}, `;
        }
        str += `$${len}) RETURNING id`;
        const res = await query(this.pool, str, array);
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * Set vote
     * @param {String} nickname
     * @param {number} id
     * @param {boolean} voteSign
     */
    async vote(nickname, id, voteSign) {
        const checkUser = await this.userRepository.getUser({nickname});
        if (checkUser.type === STATUSES.NOT_FOUND) {
            return checkUser;
        }
        let checkThread = {};
        if (this.isInt(id.toString())) {
            checkThread = await this.getThread({id});
        } else {
            checkThread = await this.getThread({slug: id});
        }
        if (checkThread.type === STATUSES.NOT_FOUND) {
            return checkThread;
        }
        id = checkThread.body.id;
        const checkVote = await this._checkVote(nickname, id, voteSign);
        if (checkVote === false) {
            checkThread.body.votes += (voteSign ? 1 : -1);
            await this._createFirstVote(nickname, id, voteSign);
            return responseModel(STATUSES.SUCCESS, checkThread.body);
        }
        if (checkVote.vote) {
            if (voteSign) {
                return responseModel(STATUSES.SUCCESS, checkThread.body);
            }
            checkThread.body.votes -= 2;
        } else {
            if (!voteSign) {
                return responseModel(STATUSES.SUCCESS, checkThread.body);
            }
            checkThread.body.votes += 2;
        }
        await this._createSecondVote(nickname, id, voteSign);
        return responseModel(STATUSES.SUCCESS, checkThread.body);
    }

    /**
     * Vote create
     * @param {String} nickname
     * @param {number} id
     * @param {number} voteSign
     */
    async _makeVote(nickname, id, voteSign) {
        const str = 'UPDATE votes SET vote = $1 WHERE thread = $2 AND author = $3;';
        let req = await query(this.pool, str, [
            voteSign,
            id,
            nickname,
        ]);
        if (req.rowCount === 0) {
            const str2 = 'INSERT INTO votes (author, thread, vote) VALUES ($1, $2, $3);';
            await query(this.pool, str2, [
                nickname,
                id,
                voteSign,
            ]);
        }
        const str3 = 'SELECT votes FROM thread WHERE id = $1';
        let result = await query(this.pool, str3, [
            id,
        ]);
        return responseModel(STATUSES.SUCCESS, result.rows[0]);
    }

    /**
     * Vote create
     * @param {String} nickname
     * @param {number} id
     * @param {boolean} voteSign
     */
    async _createFirstVote(nickname, id, voteSign) {
        const str = 'insert into votes (author, thread, vote) values ($1, $2, $3)';
        await query(this.pool, str, [
            nickname,
            id,
            voteSign,
        ]);
        return responseModel(STATUSES.SUCCESS, 'ok');
    }

    /**
     * Vote create
     * @param {String} nickname
     * @param {number} id
     * @param {boolean} voteSign
     */
    async _createSecondVote(nickname, id, voteSign) {
        const str = 'UPDATE votes set vote = $1 where author = $2 and thread = $3';
        await query(this.pool, str, [
            voteSign,
            nickname,
            id,
        ]);
        return responseModel(STATUSES.SUCCESS, 'ok');
    }

    /**
     * Set vote
     * @param {String} nickname
     * @param {number} id
     * @param {boolean} voteSign
     */
    async _checkVote(nickname, id, voteSign) {
        const str = 'SELECT vote from votes where author = $1 AND thread = $2';
        const res = await query(this.pool, str, [
            nickname,
            id,
        ]);
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * @param {String} value
     * @return {boolean}
     */
    isInt(value) {
        const er = /^-?[0-9]+$/;
        return er.test(value);
    }

}
