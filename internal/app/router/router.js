import UserDelivery from '../../pkg/user/delivery.js';
import ForumDelivery from '../../pkg/forum/delivery.js';
import ThreadDelivery from '../../pkg/thread/delivery.js';
import {API} from '../../../config/constants.js';
import PostDelivery from '../../pkg/post/delivery.js';
import ServiceDelivery from '../../pkg/service/delivery.js';

export const router = (app, pool) => {
    const userDelivery = new UserDelivery(pool);
    const forumDelivery = new ForumDelivery(pool);
    const threadDelivery = new ThreadDelivery(pool);
    const postDelivery = new PostDelivery(pool);
    const serviceDelivery = new ServiceDelivery(pool);

    app.get(API + '/service/status', (request, response) => {
        serviceDelivery.getData(request, response);
    });

    app.post(API + '/service/clear', (request, response) => {
        serviceDelivery.clear(request, response);
    });

    app.post(API + '/user/:nickname/create', (request, response) => {
        userDelivery.createUser(request, response);
    });

    app.get(API + '/user/:nickname/profile', (request, response) => {
        userDelivery.getUser(request, response);
    });

    app.post(API + '/user/:nickname/profile', (request, response) => {
        userDelivery.updateUser(request, response);
    });

    app.post(API + '/forum/create', (request, response) => {
        forumDelivery.createForum(request, response);
    });

    app.get(API + '/forum/:slug/details', (request, response) => {
        forumDelivery.getForum(request, response);
    });

    app.post(API + '/forum/:forum/create', (request, response) => {
        threadDelivery.createThread(request, response);
    });

    app.get(API + '/forum/:slug/threads', (request, response) => {
        threadDelivery.getThreadList(request, response);
    });

    app.get(API + '/forum/:slug/users', (request, response) => {
        forumDelivery.getUserList(request, response);
    });

    app.get(API + '/thread/:data/details', (request, response) => {
        threadDelivery.getThread(request, response);
    });

    app.post(API + '/thread/:thread/details', (request, response) => {
        threadDelivery.updateThread(request, response);
    });

    app.post(API + '/thread/:thread/create', (request, response) => {
        postDelivery.createPost(request, response);
    });

    app.post(API + '/thread/:thread/vote', (request, response) => {
        threadDelivery.vote(request, response);
    });

    app.get(API + '/thread/:thread/posts', (request, response) => {
        postDelivery.getPostList(request, response);
    });

    app.post(API + '/post/:id/details', (request, response) => {
        postDelivery.updatePost(request, response);
    });

    app.get(API + '/post/:id/details', (request, response) => {
        postDelivery.getPost(request, response);
    });
};
