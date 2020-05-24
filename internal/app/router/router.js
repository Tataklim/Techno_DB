import UserDelivery from '../../pkg/user/delivery.js';
import ForumDelivery from '../../pkg/forum/delivery.js';
import ThreadDelivery from '../../pkg/thread/delivery.js';
import {API} from '../../../config/constants.js';
import PostDelivery from '../../pkg/post/delivery.js';

export const router = (app, pool) => {
    const userDelivery = new UserDelivery(pool);
    const forumDelivery = new ForumDelivery(pool);
    const threadDelivery = new ThreadDelivery(pool);
    const postDelivery = new PostDelivery(pool);

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

    app.get(API + '/forum/:slug/thread', (request, response) => {
        threadDelivery.getThreadList(request, response);
    });
    //
    // app.get(API + '/thread/:data/details', (request, response) => {
    //     threadDelivery.getThread(request, response);
    // });

    app.post(API + '/thread/:thread/create', (request, response) => {
        // console.log('createPost');
        postDelivery.createPost(request, response);
    });

    app.get(API + '/thread/:thread/posts', (request, response) => {
        // console.log('getPostList');
        postDelivery.getPostList(request, response);
    });

    app.post(API + '/post/:id/details', (request, response) => {
        // console.log('updatePost');
        postDelivery.updatePost(request, response);
    });

    app.get(API + '/post/:id/details', (request, response) => {
        // console.log('getPost');
        postDelivery.getPost(request, response);
    });
};
