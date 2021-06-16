const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const { authenticateJWT, ensureCorrectUser, ensureLoggedIn} = require('../middleware/auth');
const Message = require('../models/message');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const id = parseInt(idParam, 10);
        const message = await Message.get(id);

        if (req.user.username === message.from_user.username || req.user.username === message.to_user.username) {
            return res.json({message});
        } else {
            throw new ExpressError("Not Authorized; You are not authorized to view this message", 401);
        }
        
    } catch(e) {
        return next(e);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body;
        const from_username = req.user.username;
        const message = await Message.create({from_username, to_username, body});

        return res.json({message});
    } catch(e) {
        return next(e);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        const idParam = req.params.id;
        const id = parseInt(idParam, 10);
        const message = await Message.get(id);
        if (!message) throw new ExpressError(`Not Found; A message with id = ${id} could not be found`, 404);
        if (message.to_user.username === req.user.username) {
            const readAt = await Message.markRead(id);
            return res.json({message: readAt});
        } else {
            throw new ExpressError("Unauthorized; You are not authorized to mark this message read", 401);
        }
    } catch(e) {
        return next(e);
    }
})

module.exports = router;