import UserRepository from './repository.js';
import {userModel} from '../models/user.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * kek
 */
export default class UserDelivery {
    /**
     * Constructor
     * @param {Object} pool
     */
    constructor(pool) {
        // this.pool = pool;
        this.repository = new UserRepository(pool);
    }

    /**
     * User creation
     * @param {Object} request
     * @param {Object} response
     */
    createUser(request, response) {
        const user = userModel(
            request.params.nickname,
            request.body.fullname,
            request.body.email,
            request.body.about,
        );
        this.repository.createUser(user)
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(201).send(result.body);
                    break;
                case STATUSES.DUPLICATION:
                    response.status(409).send(result.body);
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
     * User getting
     * @param {Object} request
     * @param {Object} response
     */
    getUser(request, response) {
        const user = userModel(
            request.params.nickname,
        );
        const promise = this.repository.getUser(user);
        promise.then((result) => {
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
        }).catch((error) => {
            response.status(500);
        });
    }

    /**
     * User updating
     * @param {Object} request
     * @param {Object} response
     */
    updateUser(request, response) {
        const user = userModel(
            request.params.nickname,
            request.body.fullname,
            request.body.email,
            request.body.about,
        );
        const promise = this.repository.updateUser(user);
        promise.then((result) => {
            switch (result.type) {
            case STATUSES.SUCCESS:
                response.status(200).send(result.body);
                break;
            case STATUSES.NOT_FOUND:
                response.status(404).send({message: result.body});
                break;
            case STATUSES.DUPLICATION:
                response.status(409).send({message: result.body});
                break;
            default:
                response.status(500);
                break;
            }
        }).catch((error) => {
            response.status(500);
        });
    }
}
