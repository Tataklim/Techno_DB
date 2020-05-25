// import RepositoryPost from './repository.js';
// import {postModel} from '../models/post.js';
import PostUseCase from './usecase.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * Delivery post
 */
export default class PostDelivery {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.useCase = new PostUseCase(pool);
    }

    /**
     * Post creation
     * @param {Object} request
     * @param {Object} response
     */
    createPost(request, response) {
        this.useCase.createPost(request.params.thread, request.body)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(201).send(result.body);
                    break;
                case STATUSES.WRONG_PARENT:
                    response.status(409).send({message: result.body});
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500).send({message: result.body});
                    break;
                }
            });
    }

    /**
     * Post update
     * @param {Object} request
     * @param {Object} response
     */
    updatePost(request, response) {
        this.useCase.updatePost(request.params.id, request.body.message)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500).send({message: result.body});
                    break;
                }
            });
    }

    /**
     * Post getting
     * @param {Object} request
     * @param {Object} response
     */
    getPost(request, response) {
        const params = request.query.related;
        this.useCase.getPost(request.params.id, params)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500).send({message: result.body});
                    break;
                }
            });
    }

    /**
     * Get thread's posts
     * @param {Object} request
     * @param {Object} response
     */
    getPostList(request, response) {
        const limit = request.query.limit;
        const since = request.query.since;
        const sort = request.query.sort;
        const desc = (request.query.desc === 'true');
        this.useCase.getPostList(request.params.thread, {
            limit,
            since,
            sort,
            desc,
        })
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500).send({message: result.body});
                    break;
                }
            });
    }
}
