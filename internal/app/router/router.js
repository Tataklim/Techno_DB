import UserDelivery from '../../pkg/user/delivery.js';
import ForumDelivery from '../../pkg/forum/delivery.js';
import ThreadDelivery from '../../pkg/thread/delivery.js';

export const router = (app, pool) => {
    const userDelivery = new UserDelivery(pool);
    const forumDelivery = new ForumDelivery(pool);
    const threadDelivery = new ThreadDelivery(pool);

    // app.get('*', function(req, res) {
    //     // kek();
    //     console.log(req.originalUrl);
    // });

    app.post('/user/:nickname/create', (request, response) => {
        userDelivery.createUser(request, response);
    });

    app.get('/user/:nickname/profile', (request, response) => {
        userDelivery.getUser(request, response);
    });

    app.post('/user/:nickname/profile', (request, response) => {
        userDelivery.updateUser(request, response);
    });

    app.post('/forum/create', (request, response) => {
        forumDelivery.createForum(request, response);
    });

    app.get('/forum/:slug/details', (request, response) => {
        forumDelivery.getForum(request, response);
    });

    app.post('/forum/:forum/create', (request, response) => {
        threadDelivery.createThread(request, response);
    });

    app.get('/thread/:data/details', (request, response) => {
        threadDelivery.getThread(request, response);
    });
};
