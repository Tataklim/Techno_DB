import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';
import {query} from '../repository_helper/repository_helper.js';

/**
 * Repository post
 */
export default class RepositoryPost {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Post creation
     * @param {Object} postList
     */
    async createPost(postList) {
        const str = 'INSERT INTO post(author, created, forum, "isEdited", message, thread, parent) ' +
            'VALUES ($1,$2, $3, $4, $5, $6, $7) RETURNING id';
        for (const elem of postList) {
            const arr = [
                elem.author,
                elem.created,
                elem.forum,
                elem.isEdited,
                elem.message,
                elem.thread,
                elem.parent,
            ];
            const id = await query(this.pool, str, arr);
            elem.id = id.rows[0].id;
        }

        return responseModel(STATUSES.SUCCESS, postList);
    }

    /**
     * Post update
     * @param {number} id
     * @param {String} text
     * @param {String} prevText
     */
    async updatePost(id, text, prevText) {
        if (text === undefined) {
            return responseModel(STATUSES.SUCCESS, await this.getPost(id));
        }
        let str = 'UPDATE post SET message = $1, "isEdited" = true WHERE id = $2 ' +
            'RETURNING author, created, forum, id, "isEdited", message, parent, thread;';
        if (text === prevText) {
            str = 'UPDATE post SET message = $1 WHERE id = $2 ' +
                'RETURNING author, created, forum, id, "isEdited", message, parent, thread;';
        }
        const res = await query(this.pool, str, [
            text,
            id,
        ]);
        return responseModel(STATUSES.SUCCESS, res.rows[0]);
    }

    /**
     * Check if post with this id exists
     * @param {number} id
     */
    async checkPostExists(id) {
        const str = 'SELECT * from post where id = $1';
        const res = await query(this.pool, str, [
            id,
        ]);
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * Check parent post
     * @param {number} parentID
     * @param {number} threadID
     */
    async checkParentPost(parentID, threadID) {
        const str = 'SELECT * FROM post INNER JOIN thread t ' +
            'ON post.thread = t.id WHERE post.id = $1 AND t.id = $2';
        const res = await query(this.pool, str, [
            parentID,
            threadID,
        ]);
        if (res.rowCount === 0) {
            return responseModel(STATUSES.NOT_FOUND, 'There is not parent post with this ID');
        }
        return parentID;
    }

    /**
     * Get post info
     * @param {number} id
     */
    async getPost(id) {
        const str = 'SELECT author, created, forum, id,  "isEdited", ' +
            'message, parent, thread from post where post.id = $1';
        const res = await query(this.pool, str, [
            id,
        ]);
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * flat sort
     * @param {String} thread
     * @param {Object} params
     */
    async flatSort(thread, params) {
        let str = 'SELECT post.id, post.author, post.created, post.forum, post."isEdited", ' +
            'post.message, post.parent, post.thread from post inner join thread on ' +
            'post.thread = thread.id where thread.id = $1';
        const arr = [
            thread,
        ];
        if (params.since !== undefined) {
            str += ' AND post.id > $2';
            arr.push(params.since);
            if (params.desc) {
                str = str.replace('>', '<');
            }
        }
        str += (params.desc ?
            ' order by post.created desc, post.id desc' :
            ' order by post.created, post.id');
        if (params.limit !== undefined) {
            str += ' limit ' + params.limit;
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
    }

    /**
     * tree sort
     * @param {String} thread
     * @param {Object} params
     */
    async treeSort(thread, params) {
        let str = '';
        const arr = [];
        if (params.since !== undefined) {
            if (params.desc) {
                str = 'with elem AS (SELECT arr from post where id = $1) ' +
                    'SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, p.parent, p.thread, p.arr from post p ' +
                    'where p.thread = $2 AND p.arr < (select * from elem) order by p.arr desc, p.id';
                arr.push(params.since);
                arr.push(thread);
            } else {
                str += 'with elem AS (SELECT arr from post where id = $1), ' +
                    'lol AS (SELECT * from post p ' +
                    'where p.thread = $2 AND p.arr <= (select * from elem) ' +
                    'order by p.arr, p.id) ' +
                    'SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, p.parent, ' +
                    'p.thread, p.arr from post p where p.thread = $3 ' +
                    'order by p.arr, p.id offset (SELECT count(*) from lol)';
                arr.push(params.since);
                arr.push(thread);
                arr.push(thread);
            }
        } else {
            str += 'SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, ' +
                'p.parent, p.thread, p.arr from post p where p.thread = $1 order by p.arr, p.id';
            arr.push(thread);
            if (params.desc) {
                str = str.replace('by p.arr', 'by p.arr desc');
            }
        }
        if (params.limit !== undefined) {
            str += ' limit ' + params.limit;
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
    }

    /**
     * Parent tree sort
     * @param {String} thread
     * @param {Object} params
     */
    async parentTreeSort(thread, params) {
        let str = '';
        const arr = [];
        if (params.since !== undefined) {
            str += 'WITH kek AS (SELECT arr[1] from post where id = $1), ' +
                '     parents AS (SELECT id from post where parent = 0 AND id > (SELECT * from kek) order by id) ' +
                'SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, p.parent, p.thread, p.arr from post p ' +
                'inner join parents par on par.id = p.arr[1] ' +
                'where p.thread = $2 ' +
                'order by p.arr, p.id';
            arr.push(params.since);
            arr.push(thread);
            // }
            if (params.limit !== undefined) {
                str = str.replace('order by id', 'order by id limit ' + params.limit);
            }
            if (params.desc) {
                str = str.replace('order by id', 'order by id desc');
                str = str.replace('order by p.arr, p.id', 'order by p.arr[0] desc, p.arr, p.id');
                str = str.replace('>', '<');
            }
        } else {
            if (params.desc) {
                str = 'WITH parents AS (SELECT id from post where parent = 0 and thread = $1 order by id desc) ' +
                    'SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, p.parent, p.thread, p.arr from post p ' +
                    'inner join (SELECT id from parents) par ON p.arr[1] = par.id ' +
                    'where p.thread = $2 ' +
                    'order by p.arr[1] desc, p.arr, p.id';
                arr.push(thread);
                arr.push(thread);
                if (params.limit !== undefined) {
                    str = str.replace('order by id desc', 'order by id desc limit ' + params.limit);
                }
            } else {
                str += 'WITH parents AS (SELECT id from post where parent = 0 and thread = $1 order by id)' +
                    ' SELECT p.id, p.author, p.created, p.forum, p."isEdited", p.message, p.parent, p.thread, p.arr from post p' +
                    ' where p.thread = $2 AND p.arr[1] IN (SELECT * from parents) order by p.arr, p.id';
                arr.push(thread);
                arr.push(thread);
                if (params.limit !== undefined) {
                    str = str.replace('order by id', 'order by id limit ' + params.limit);
                }
            }
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
    }

    /**
     * default sort by id
     * @param {String} thread
     * @param {Object} params
     */
    async defaultSort(thread, params) {
        let str = 'SELECT p.id, p.author, p.created, p.forum,p."isEdited",p.message,p.parent,' +
            'p.thread from post p inner join thread t on p.thread = t.id where t.slug = $1';
        const arr = [
            thread,
        ];
        let pos = 2;
        if (params.since !== undefined) {
            str += ' and p.id > $' + pos;
            arr.push(params.since);
            pos++;
        }
        str += ' order by p.id';
        if (params.desc) {
            str += ' desc';
            if (params.since !== undefined) {
                str = str.replace('>', '<');
            }
        }
        if (params.limit !== undefined) {
            str += ' limit $' + pos;
            pos++;
            arr.push(params.limit);
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
    }
}
