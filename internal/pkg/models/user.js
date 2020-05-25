export const userModel = (nickname, fullname = '', email = '', about = '') => {
    return {
        nickname,
        fullname,
        email,
        about,
    };
};
