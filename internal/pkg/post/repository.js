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
     * @param {Object} sql
     */
    constructor(pool, sql) {
        this.pool = pool;
        this.sql = sql;
    }

    /**
     * Post creation
     * @param {Object} postList
     */
    async createPost(postList) {
        // const str = 'INSERT INTO post(author, created, forum, "isEdited", message, thread, parent, arr) ' +
        //     'VALUES ($1,$2, $3, $4, $5, $6, $7, $8) RETURNING id';
        for (const elem of postList) {
            const arr = [
                elem.author,
                elem.created,
                elem.forum,
                elem.isEdited,
                elem.message,
                elem.thread,
                elem.parent,
                elem.arr,
            ];
            // if (arr[7] !== '{}' ) {
            const kek = await this.sql`INSERT INTO post(author, created, forum, "isEdited", message, thread, parent, arr) 
VALUES (${arr[0]},${arr[1]}, ${arr[2]}, ${arr[3]}, ${arr[4]}, ${arr[5]}, ${arr[6]}, ARRAY[${arr[7]}]) RETURNING id`
            // } else {
            //     kek = await this.sql`INSERT INTO post(author, created, forum, "isEdited", message, thread, parent, arr)
// VALUES (${arr[0]},${arr[1]}, ${arr[2]}, ${arr[3]}, ${arr[4]}, ${arr[5]}, ${arr[6]}, ${arr[7]}) RETURNING id`
//             }
            // const id = await query(this.pool, str, arr);
            // elem.id = id.rows[0].id;
            elem.id = kek[0].id;
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
        let str = 'UPDATE post SET message = $1, "isEdited" = true WHERE id = $2 RETURNING author, created, forum, id, "isEdited", message, parent, thread;';
        if (text === prevText) {
            str = 'UPDATE post SET message = $1 WHERE id = $2 RETURNING author, created, forum, id, "isEdited", message, parent, thread;';
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
        const str = 'SELECT arr, thread FROM post WHERE id = $1';
        const res = await query(this.pool, str, [
            parentID,
        ]);
        // const res = await this.sql`SELECT arr, thread FROM post WHERE id = ${parentID}`
        // console.log(res)
        if (res.rowCount === 0 || res.rows[0].thread !== threadID) {
            return responseModel(STATUSES.NOT_FOUND, 'There is not parent post with this ID');
        }

        return res.rows[0].arr;
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
     * tree sort
     * @param {String} thread
     * @param {Object} params
     */
    async treeSort(thread, params) {
        let str = '';
        const arr = [];
        if (params.since !== undefined) {
            if (params.desc) {
                str = `SELECT id, author, parent, message, forum, thread, created
                       FROM post
                       WHERE thread = $1
                         AND (arr < (SELECT arr FROM post WHERE id = $2))
                       ORDER BY arr desc`;
                arr.push(thread);
                arr.push(params.since);
            } else {
                str = `SELECT id, author, parent, message, forum, thread, created
                       FROM post
                       WHERE thread = $1
                         AND (arr > (SELECT arr FROM post WHERE id = $2))
                       ORDER BY arr `;
                arr.push(thread);
                arr.push(params.since);
            }
        } else {
            str = `SELECT id, author, parent, message, forum, thread, created
                   FROM post
                   WHERE thread = $1
                   ORDER by arr `;
            arr.push(thread);
            if (params.desc) {
                str += 'desc';
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
            arr.push(thread);
            arr.push(params.since);
            if (params.limit !== undefined) {
                str = `  SELECT id, author, parent, message, forum, thread, created
                         FROM post p
                         WHERE p.thread = $1
                           and p.arr[1] IN (
                             SELECT p2.arr[1]
                             FROM post p2
                             WHERE p2.thread = $1
                               AND p2.parent = 0
                               and p2.arr[1] > (SELECT p3.arr[1]
                                                from post p3
                                                where p3.id = $2)
                             ORDER BY p2.arr
                             LIMIT $3)
                         ORDER BY p.arr`;
                if (params.desc) {
                    str = `SELECT id, author, parent, message, forum, thread, created
                           FROM post p
                           WHERE p.thread = $1
                             and p.arr[1] IN (SELECT p2.arr[1]
                                              FROM post p2
                                              WHERE p2.thread = $1
                                                AND p2.parent = 0
                                                and p2.arr[1] < (SELECT p3.arr[1] from post p3 where p3.id = $2)
                                              ORDER BY p2.arr DESC
                                              LIMIT $3
                           )
                           ORDER BY p.arr[1] DESC, p.arr[2:]`;
                }
                arr.push(params.limit);
            } else {
                str = `  SELECT id, author, parent, message, forum, thread, created
                         FROM post p
                         WHERE p.thread = $1
                           and p.arr[1] IN (SELECT p2.arr[1]
                                            FROM post p2
                                            WHERE p2.thread = $1
                                              AND p2.parent = 0
                                              and p2.arr[1] > (SELECT p3.arr[1]
                                                               from post p3
                                                               where p3.id = $2)
                                            ORDER BY p2.arr)
                         ORDER BY p.arr`;
                if (params.desc) {
                    str = `  SELECT id, author, parent, message, forum, thread, created
                             from posts p
                             WHERE p.thread = $1
                               and p.arr[1] IN (
                                 SELECT p2.arr[1]
                                 FROM posts p2
                                 WHERE p2.thread = $1
                                   AND p2.parent = 0
                                   and p2.arr[1] < (SELECT p3.arr[1] from posts p3 where p3.id = $2)
                                 ORDER BY p2.arr DESC
                                 limit $3
                             )
                             ORDER BY p.arr[1] DESC, p.arr[2:]`;
                    arr.push(params.desc);
                }

            }

            if (params.desc) {
                str = str.replace('order by id', 'order by id desc');
                str = str.replace('order by p.arr, p.id', 'order by p.arr[0] desc, p.arr, p.id');
                str = str.replace('>', '<');
            }
        } else {
            if (params.desc) {
                str = `  SELECT id, author, parent, message, forum, thread, created
                         FROM post
                         WHERE thread = $1
                           AND arr[1] IN (
                             SELECT arr[1]
                             FROM post
                             WHERE thread = $1
                             GROUP BY arr[1]
                             ORDER BY arr[1] DESC`;
                arr.push(thread);
                if (params.limit !== undefined) {
                    str += ' LIMIT $2';
                    arr.push(params.limit);
                }
                str += ') ORDER BY arr[1] DESC, arr';
            } else {
                str = ` SELECT id, author, parent, message, forum, thread, created
                        FROM post
                        WHERE thread = $1
                          and arr[1] IN (
                            SELECT arr[1]
                            FROM post
                            WHERE thread = $1
                            GROUP BY arr[1]
                            ORDER BY arr[1]`;
                arr.push(thread);
                if (params.limit !== undefined) {
                    str += ' LIMIT $2';
                    arr.push(params.limit);
                }
                str += ') ORDER BY arr';
            }
        }
        const res = await query(this.pool, str, arr);
        return responseModel(STATUSES.SUCCESS, res.rows);
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
}
