const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const ExpressError = require('../expressError');
const { ensureLoggedIn, authenticateJWT, ensureCorrectUser } = require('../middleware/auth');
const { route } = require('../app');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        result = await User.all();

        return res.json(result);
    } catch(e) {
        return next(e);
    }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', authenticateJWT, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.get(username);
        if (!user) throw new ExpressError(`Not Found; Username ${username} could not be found`, 404);

        return res.json({user});
    } catch(e) {
        return next(e);
    }
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', authenticateJWT, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.params;
        const messages = await User.messagesTo(username);
        
        return res.json({messages});
    } catch(e) {
        return next(e);
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', authenticateJWT, ensureCorrectUser, async (req, res, next) => {
    try {
        const { username } = req.params;
        const messages = await User.messagesFrom(username);
        
        return res.json({messages});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;