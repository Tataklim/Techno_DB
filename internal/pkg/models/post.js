export const postModel = (author, message, thread,
    forum = undefined,
    parent = undefined) => {
    if (author === undefined || message === undefined || thread === undefined) {
        return {'error': 'error'};
    }
    const post = {
        message,
        author,
    };
    if (!isInt(thread)) {
        post['threadSlug'] = thread;
    } else {
        post['threadID'] = thread;
    }
    if (forum !== undefined) {
        post['forum'] = forum;
    }
    if (parent !== undefined) {
        post['parent'] = parent;
    }
    return post;
};

const isInt = (value) => {
    const er = /^-?[0-9]+$/;
    return er.test(value);
};

