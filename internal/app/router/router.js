import UserDelivery from '../../pkg/user/delivery.js';

export const router = (app, pool) => {
    const userDelivery = new UserDelivery(pool);

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

    // app.post('*', function(req, res) {
    //     console.log(req.originalUrl);
    // });
};
