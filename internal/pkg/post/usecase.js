import RepositoryPost from './repository.js';
import {postModel} from '../models/post.js';
import {responseModel} from '../models/response.js';
import {STATUSES} from '../../../config/constants.js';
import ThreadRepository from '../thread/repository.js';
import UserRepository from '../user/repository.js';
import ForumRepository from '../forum/repository.js';

/**
 * useCase post
 */
export default class PostUseCase {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.repository = new RepositoryPost(pool);
        this.threadRepository = new ThreadRepository(pool);
        this.userRepository = new UserRepository(pool);
        this.forumRepository = new ForumRepository(pool);
    }

    /**
     * Post creation
     * @param {String} thread
     * @param {Object} postList
     */
    async createPost(thread, postList) {
        const arr = [];
        const curDay = new Date();
        for (const elem of postList) {
            const postData = await this.getPostThread(thread, elem);
            if (postData.type !== undefined) {
                return postData;
            }
            const author = await this.userRepository.getUser({nickname: postData.author});
            if (author.type !== STATUSES.SUCCESS) {
                return author;
            }
            postData.isEdited = false;
            postData.parent = await this.checkParent(postData.parent, postData.thread);
            if (postData.parent.type !== undefined) {
                return responseModel(STATUSES.WRONG_PARENT, 'no parent');
            }
            postData.created = curDay;
            arr.push(postData);
        }

        if (arr.length === 0) {
            let threadID = undefined;
            let threadSlug = undefined;
            if (this.isInt(thread)) {
                threadID = thread;
            } else {
                threadSlug = thread;
            }
            const threadData = await this.threadRepository.getThread({
                slug: threadSlug,
                id: threadID,
            });
            if (threadData.type === STATUSES.NOT_FOUND) {
                return threadData;
            }
            return responseModel(STATUSES.SUCCESS, []);
        }

        return await this.repository.createPost(arr);
    }

    /**
     * Check parent
     * @param {number} parentID
     * @param {number} threadID
     * @return {number}
     * @return {Object}
     */
    async checkParent(parentID, threadID) {
        if (parentID === undefined) {
            return 0;
        }
        return await this.repository.checkParentPost(parentID, threadID);
    }

    /**
     * Проверка всех данных одного поста
     * @param {String} thread
     * @param {Object} elem
     */
    async getPostThread(thread, elem) {
        const single = (postModel(
            elem.author,
            elem.message,
            thread,
            elem.forum,
            elem.parent,
        ));
        const threadData = await this.threadRepository.getThread({
            slug: single.threadSlug,
            id: single.threadID,
        });
        if (threadData.type === STATUSES.NOT_FOUND) {
            return threadData;
        }
        if (single.error !== undefined) {
            return responseModel(STATUSES.SUCCESS, []);
        }
        if (single.forum !== undefined && single.forum !== threadData.body.forum) {
            return responseModel(STATUSES.NOT_FOUND, threadData);
        }
        single.thread = threadData.body.id;
        single.forum = threadData.body.forum;
        return single;
    }

    /**
     * Проверка на сущетсоввание родительсокго поста
     */
    /**
     * Post update
     * @param {number} id
     * @param {String} text
     */
    async updatePost(id, text) {
        const checkPost = await this.repository.checkPostExists(id);
        if (!checkPost) {
            return responseModel(STATUSES.NOT_FOUND, 'There is not post with this id');
        }
        return await this.repository.updatePost(id, text, checkPost.message);
    }

    /**
     * Post getting
     * @param {number} id
     * @param {String} related
     */
    async getPost(id, related) {
        const res = {};
        const checkPost = await this.repository.checkPostExists(id);
        if (!checkPost) {
            return responseModel(STATUSES.NOT_FOUND, 'There is not post with this id');
        }
        res.post = await this.repository.getPost(id);
        if (related === undefined) {
            return responseModel(STATUSES.SUCCESS, res);
        }
        if (related.includes('user')) {
            const user = await this.userRepository.getUser({nickname: res.post.author});
            res.author = user.body;
        }
        if (related.includes('thread')) {
            const thread = await this.threadRepository.getThread({id: res.post.thread});
            res.thread = thread.body;
        }
        if (related.includes('forum')) {
            const forum = await this.forumRepository.getForum({slug: res.post.forum});
            res.forum = forum.body;
        }
        return responseModel(STATUSES.SUCCESS, res);
    }

    /**
     * @param {String} thread
     * @param {Object} params
     */
    async getPostList(thread, params) {
        const threadModel = {};
        threadModel.slug = thread;
        if (this.isInt(thread)) {
            threadModel.id = thread;
        }
        const threadExists = await this.threadRepository.getThread(threadModel);
        if (threadExists.type !== STATUSES.SUCCESS) {
            return threadExists;
        }
        switch (params.sort) {
        case 'flat':
            return await this.repository.flatSort(threadExists.body.id, params);
        case 'tree':
            return await this.repository.treeSort(threadExists.body.id, params);
        case 'parent_tree':
            return await this.repository.parentTreeSort(threadExists.body.id, params);
        default:
            return await this.repository.defaultSort(threadExists.body.slug, params);
        }
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

