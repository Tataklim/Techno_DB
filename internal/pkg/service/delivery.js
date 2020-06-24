import ServiceRepository from './repository.js';
import {STATUSES} from '../../../config/constants.js';

/**
 * Service delivery
 */
export default class ServiceDelivery {
    /**
     * Constructor
     * @param {Object} sql
     */
    constructor(sql) {
        this.repository = new ServiceRepository(sql);
    }

    /**
     * User getting
     * @param {Object} request
     * @param {Object} response
     */
    getData(request, response) {
        this.repository.getData()
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
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
     * Clear
     * @param {Object} request
     * @param {Object} response
     */
    clear(request, response) {
        this.repository.clear()
            .then((result) => {
                switch (result.type) {
                case STATUSES.SUCCESS:
                    response.status(200).send(result.body);
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
