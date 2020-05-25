import ForumRepository from './repository.js';
import {forumModel} from '../models/forum.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * Forum delivery
 */
export default class ForumDelivery {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.repository = new ForumRepository(pool);
    }
    /**
     * User getting
     * @param {Object} request
     * @param {Object} response
     */
    getUserList(request, response) {
        const limit = request.query.limit;
        const since = request.query.since;
        const desc = (request.query.desc === 'true');
        this.repository.getUserList(request.params.slug, {
            limit,
            since,
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
                    response.status(500);
                    break;
                }
            })
            .catch((error) => {
                response.status(500);
            });
    }

    /**
     * Post creation
     * @param {Object} request
     * @param {Object} response
     */
    createForum(request, response) {
        const forum = forumModel(
            request.body.slug,
            request.body.user,
            request.body.title,
            request.body.posts,
            request.body.threads,
        );
        this.repository.createForum(forum)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(201).send(result.body);
                    break;
                case STATUSES.DUPLICATION:
                    response.status(409).send(result.body);
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500);
                    break;
                }
            })
            .catch((error) => {
                response.status(500);
            });
    }

    /**
     * Post creation
     * @param {Object} request
     * @param {Object} response
     */
    getForum(request, response) {
        const forum = forumModel(
            request.params.slug,
        );
        this.repository.getForum(forum)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
                    break;
                case STATUSES.NOT_FOUND:
                    response.status(404).send({message: result.body});
                    break;
                default:
                    response.status(500);
                    break;
                }
            })
            .catch((error) => {
                response.status(500);
            });
    }
}
