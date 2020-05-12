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
     */
    constructor(pool) {
        this.pool = pool;
        this.userRepository = new UserRepository(pool);
        this.forumRepository = new ForumRepository(pool);
    }

    /**
     * Thread creation
     * @param {Object} thread
     * @return {Object}
     */
    async createThread(thread) {
        if (thread.slug !== undefined) {
            const duplication = await this._getThreadBySlug(thread);
            console.log('duplication');
            console.log(duplication);
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
     * Check if exists by slug
     * @param {Object} thread
     * @return {Object}
     */
    async _getThreadBySlug(thread) {
        if (thread.slug === undefined) {
            return false;
        }
        const str = 'SELECT id, forum, author, title, message, slug, created, votes' +
            ' FROM thread WHERE lower(slug) = $1';
        const res = await query(this.pool, str, [
            thread.slug.toLowerCase(),
        ]);
        return res.rowCount === 0 ? false : res.rows[0];
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
        const str = 'SELECT id, forum, author, title, message, slug, created, votes' +
            ' FROM thread WHERE id = $1';
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
        // if (res.rowCount === 0) {
        //     console.log(thread);
        //     console.log(res);
        // }
        return res.rowCount === 0 ? false : res.rows[0];
    }
}
