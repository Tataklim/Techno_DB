export const threadModel = (forum, author, title, message,
    slug = undefined, created = undefined,
    votes = undefined, id = undefined) => {
    const thread = {
        forum,
        author,
        title,
        message,
    };
    if (slug !== undefined) {
        thread['slug'] = slug;
    }
    if (created !== undefined) {
        thread['created'] = created;
    }
    if (votes !== undefined) {
        thread['votes'] = votes;
    }
    if (id !== undefined) {
        thread['id'] = id;
    }
    return thread;
};
