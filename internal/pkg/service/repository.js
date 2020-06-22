import {query} from '../repository_helper/repository_helper.js';
import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * kek
 */
export default class ServiceRepository {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Get data
     */
    async getData() {
        const forumStr = 'SELECT count(*) from forum';
        const postStr = 'SELECT count(*) from post';
        const threadStr = 'SELECT count(*) from thread';
        const userStr = 'SELECT count(*) from users';
        const forum = await query(this.pool, forumStr, []);
        const post = await query(this.pool, postStr, []);
        const thread = await query(this.pool, threadStr, []);
        const user = await query(this.pool, userStr, []);
        // console.log({
        //     forum: parseInt(forum.rows[0].count),
        //     post: parseInt(post.rows[0].count),
        //     thread: parseInt(thread.rows[0].count),
        //     user: parseInt(user.rows[0].count),
        // });
        return responseModel(STATUSES.SUCCESS, {
            forum: parseInt(forum.rows[0].count),
            post: parseInt(post.rows[0].count),
            thread: parseInt(thread.rows[0].count),
            user: parseInt(user.rows[0].count),
        });
    }

    /**
     * clear
     */
    async clear() {
        const str = 'truncate table votes RESTART IDENTITY cascade; ' +
            'truncate table post RESTART IDENTITY cascade; ' +
            'truncate table forum RESTART IDENTITY cascade; ' +
            'truncate table thread RESTART IDENTITY cascade; ' +
            'truncate table users RESTART IDENTITY cascade;';
        await query(this.pool, str, []);
        return this.getData();
    }
}
