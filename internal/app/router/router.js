import UserDelivery from '../../pkg/user/delivery.js';
import ForumDelivery from '../../pkg/forum/delivery.js';
import ThreadDelivery from '../../pkg/thread/delivery.js';
import {API} from '../../../config/constants.js';
import PostDelivery from '../../pkg/post/delivery.js';
import ServiceDelivery from '../../pkg/service/delivery.js';

export const router = (app, pool, pool2, sql) => {
    const userDelivery = new UserDelivery(pool, sql);
    const forumDelivery = new ForumDelivery(pool, sql);
    const threadDelivery = new ThreadDelivery(pool, sql);
    const postDelivery = new PostDelivery(pool, sql);
    const serviceDelivery = new ServiceDelivery(pool2);

    app.get(API + '/service/status', (request, reply) => {
        serviceDelivery.getData(request, reply);
    });

    app.post(API + '/service/clear', (request, reply) => {
        serviceDelivery.clear(request, reply);
    });

    app.post(API + '/user/:nickname/create', (request, reply) => {
        userDelivery.createUser(request, reply);
    });

    app.get(API + '/user/:nickname/profile', (request, reply) => {
        userDelivery.getUser(request, reply);
    });

    app.post(API + '/user/:nickname/profile', (request, reply) => {
        userDelivery.updateUser(request, reply);
    });

    app.post(API + '/forum/create', (request, reply) => {
        forumDelivery.createForum(request, reply);
    });

    app.get(API + '/forum/:slug/details', (request, reply) => {
        forumDelivery.getForum(request, reply);
    });

    app.post(API + '/forum/:forum/create', (request, reply) => {
        threadDelivery.createThread(request, reply);
    });

    app.get(API + '/forum/:slug/threads', (request, reply) => {
        threadDelivery.getThreadList(request, reply);
    });

    app.get(API + '/forum/:slug/users', (request, reply) => {
        forumDelivery.getUserList(request, reply);
    });

    app.get(API + '/thread/:data/details', (request, reply) => {
        threadDelivery.getThread(request, reply);
    });

    app.post(API + '/thread/:thread/details', (request, reply) => {
        threadDelivery.updateThread(request, reply);
    });

    app.post(API + '/thread/:thread/create', (request, reply) => {
        postDelivery.createPost(request, reply);
    });

    app.post(API + '/thread/:thread/vote', (request, reply) => {
        threadDelivery.vote(request, reply);
    });

    app.get(API + '/thread/:thread/posts', (request, reply) => {
        postDelivery.getPostList(request, reply);
    });

    app.post(API + '/post/:id/details', (request, reply) => {
        postDelivery.updatePost(request, reply);
    });

    app.get(API + '/post/:id/details', (request, reply) => {
        postDelivery.getPost(request, reply);
    });
};
