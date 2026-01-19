const authProvider = require('../auth/AuthProvider');

exports.signIn = (req, res, next) => {
    return authProvider.login(req, res, next);
};

exports.handleRedirect = (req, res, next) => {
    return authProvider.handleRedirect(req, res, next);
};

exports.signOut = (req, res, next) => {
    return authProvider.logout(req, res, next);
};
