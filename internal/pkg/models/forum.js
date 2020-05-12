export const forumModel = (slug, user = '', title = '', posts = undefined, threads = undefined) => {
    const forum = {
        slug,
        user,
        title,
    };
    if (posts !== undefined) {
        forum['posts'] = posts;
    }
    if (threads !== undefined) {
        forum['threads'] = threads;
    }
    return forum;
};
