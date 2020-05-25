import {query} from '../repository_helper/repository_helper.js';
import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';
import UserRepository from '../user/repository.js';

/**
 * kek
 */
export default class ForumRepository {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.pool = pool;
        this.userRepository = new UserRepository(pool);
    }


    /**
     * Getting user
     * @param {Object} forum
     * @return {Object}
     */
    async createForum(forum) {
        const duplication = await this._getForumBySlug(forum);
        if (duplication !== false) {
            return responseModel(STATUSES.DUPLICATION, duplication);
        }
        const user = await this.userRepository.getUser({nickname: forum.user});
        if (user.type === STATUSES.NOT_FOUND) {
            return user;
        }
        forum.user = user.body.nickname;
        await this._createForum(forum);
        return responseModel(STATUSES.SUCCESS, forum);
    }

    /**
     * Getting user list
     * @param {String} slug
     * @param {Object} params
     * @return {Object}
     */
    async getUserList(slug, params) {
        const checkForum = await this.getForum({slug});
        if (checkForum.type === STATUSES.NOT_FOUND) {
            return checkForum;
        }

        let str = 'with forum_users as (SELECT u.nickname, u.fullname, u.email, u.about from users u ' +
            '    left join post p on u.nickname = p.author ' +
            '    left join thread t on u.nickname = t.author ' +
            '    where t.forum = $1 or p.forum = $2 group by u.nickname, u.fullname, u.email, u.about ' +
            'order by u.nickname) ' +
            'SELECT nickname, fullname, about, email FROM forum_users ';
            // 'WHERE LOWER(nickname) > LOWER(\'mel.FoDE6e52KW33ju\') ' +
            // 'ORDER BY nickname';
        const arr = [
            slug,
            slug,
        ];
        if (params.since !== undefined) {
            str += 'WHERE LOWER(nickname) > LOWER($' + (arr.length+1)+ ') ';
            arr.push(params.since);
            if (params.desc) {
                str = str.replace('>', '<');
            }
        }
        str += ' ORDER BY nickname ';
        if (params.desc) {
            str += ' desc ';
        }
        if (params.limit !== undefined) {
            str += ' limit ' + params.limit;
        }
        const res = await query(this.pool, str, arr);
        if (res.rowCount === 0) {
            return responseModel(STATUSES.SUCCESS, []);
        }
        return responseModel(STATUSES.SUCCESS, res.rows);
    }

    /**
     * Getting user
     * @param {Object} forum
     * @return {Object}
     */
    async getForum(forum) {
        const forumData = await this._getForumBySlug(forum);
        if (forumData === false) {
            return responseModel(STATUSES.NOT_FOUND, 'Forum doesnt exist');
        }
        return responseModel(STATUSES.SUCCESS, forumData);
    }

    /**
     * Check if forum exists
     * @param {Object} forum
     * @return {Object}
     */
    async _getForumBySlug(forum) {
        const str = 'SELECT slug, "user", title, posts, threads' +
            ' FROM forum WHERE lower(slug) = $1';
        const res = await query(this.pool, str, [
            forum.slug.toLowerCase(),
        ]);
        if (res.rowCount > 0) {
            res.rows[0].posts = parseInt(res.rows[0].posts);
        }
        return res.rowCount === 0 ? false : res.rows[0];
    }

    /**
     * Forum creation
     * @param {Object} forum
     */
    async _createForum(forum) {
        const str = 'INSERT INTO forum (slug, "user", title, posts, threads) ' +
            'VALUES ($1, $2, $3, $4, $5)';
        await query(this.pool, str, [
            forum.slug,
            forum.user,
            forum.title,
            forum.posts ? forum.posts : 0,
            forum.threads ? forum.threads : 0,
        ]);
    }
}
