const express = require('express');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken');

const router = new express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (await User.authenticate(username, password)) {
            await User.updateLoginTimestamp();
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({token});
        } else {
            throw new ExpressError('Bad Request; Username and password do not match', 400);
        }
    } catch(e) {
        return next(e)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        const result = await User.register({username, password, first_name, last_name, phone});
        const token = jwt.sign({username: result["username"]}, SECRET_KEY);

        return res.json({token});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;