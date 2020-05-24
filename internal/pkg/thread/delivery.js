import ThreadRepository from './repository.js';
import {threadModel} from '../models/thread.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * Forum delivery
 */
export default class ThreadDelivery {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        this.repository = new ThreadRepository(pool);
    }

    /**
     * Thread creation
     * @param {Object} request
     * @param {Object} response
     */
    createThread(request, response) {
        const thread = threadModel(
            request.params.forum,
            request.body.author,
            request.body.title,
            request.body.message,
            request.body.slug,
            request.body.created,
            request.body.votes,
            request.body.id,
        );
        this.repository.createThread(thread)
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
     * Thread list getting
     * @param {Object} request
     * @param {Object} response
     */
    getThreadList(request, response) {

    }

    /**
     * Thread getting
     * @param {Object} request
     * @param {Object} response
     */
    getThread(request, response) {
        const thread = {};
        if (isNaN(parseInt(request.params.data))) {
            thread['slug'] = request.params.data;
        } else {
            thread['id'] = request.params.data;
        }
        this.repository.getThread(thread)
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
