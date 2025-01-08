const isAuthenticated = (req) => {
    return req.session && req.session.userId;
};
module.exports = isAuthenticated;