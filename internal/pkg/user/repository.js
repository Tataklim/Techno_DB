import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';
import {query} from '../repository_helper/repository_helper.js';

/**
 * kek
 */
export default class UserRepository {
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
     * Getting user
     * @param {Object} user
     * @return {Object}
     */
    async getUser(user) {
        const userData = await this._getUserByName(user);
        if (userData === false) {
            return responseModel(STATUSES.NOT_FOUND, 'Cant find user');
        }
        return responseModel(STATUSES.SUCCESS, userData);
    }

    /**
     * Create user
     * @param {Object} user
     * @return {Object}
     */
    async createUser(user) {
        const duplication = await this._checkUserDuplication(user);
        if (duplication !== false) {
            return responseModel(STATUSES.DUPLICATION, duplication);
        }
        const str = 'INSERT INTO users (nickname, fullname, email, about) ' +
            'VALUES ($1,$2,$3,$4)';
        await query(this.pool, str, [
            user.nickname,
            user.fullname,
            user.email,
            user.about,
        ]);
        return responseModel(STATUSES.SUCCESS, user);
    }

    /**
     * Update user
     * @param {Object} user
     * @return {Object}
     */
    async updateUser(user) {
        const ifExists = await this._getUserByName(user);
        if (ifExists === false) {
            return responseModel(STATUSES.NOT_FOUND, 'Cant find user');
        }
        const duplication = await this._getUserByEmail(user);
        if (duplication !== false) {
            return responseModel(STATUSES.DUPLICATION, 'This email is already exists');
        }
        user.email = user.email === '' ? ifExists.email : user.email;
        user.about = user.about === '' ? ifExists.about : user.about;
        user.fullname = user.fullname === '' ? ifExists.fullname : user.fullname;
        await this._updateUser(user);
        return responseModel(STATUSES.SUCCESS, user);
    }

    /**
     * Check if user exists
     * @param {Object} user
     * @return {Object}
     */
    async _checkUserDuplication(user) {
        const str = 'SELECT * FROM users WHERE lower(nickname) = $1 OR lower(email) = $2';
        const res = await query(this.pool, str, [
            user.nickname.toLowerCase(),
            user.email.toLowerCase(),
        ]);
        return res.rowCount === 0 ? false : res.rows;
    }

    /**
     * Get user by name
     * @param {Object} user
     * @return {Object}
     */
    async _getUserByName(user) {
        // const str = 'SELECT * FROM users WHERE nickname = $1';
        // const res = await query(this.pool, str, [
        //     user.nickname.toLowerCase(),
        // ]);
        // return res.rowCount === 0 ? false : res.rows[0];

        const res = await this.sql`SELECT * FROM users WHERE nickname = ${user.nickname.toLowerCase()}`
        return res.count === 0 ?  false: res[0]
    }

    /**
     * Get user by email
     * @param {Object} user
     * @return {Object}
     */
    async _getUserByEmail(user) {
        // const str = 'SELECT * FROM users WHERE lower(email) = $1';
        // const res = await query(this.pool, str, [
        //     user.email.toLowerCase(),
        // ]);
        // return res.rowCount === 0 ? false : res.rows[0];

        const res = await this.sql`SELECT * FROM users WHERE email = ${user.email.toLowerCase()}`
        return res.count === 0 ?  false: res[0]
    }

    /**
     * updateUser
     * @param {Object} user
     */
    async _updateUser(user) {
        const str = 'UPDATE users SET fullname = $1, email = $2, about = $3 ' +
            'WHERE lower(nickname) =$4';
        await query(this.pool, str, [
            user.fullname,
            user.email,
            user.about,
            user.nickname.toLowerCase(),
        ]);
    }
}
