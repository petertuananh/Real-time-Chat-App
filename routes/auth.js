const express = require('express');
const router = express.Router();
const functions = require("../utils/functions");
const letmeauth = require("letmeauth")
const config = require("../config.json")
router.get("/login", async (req, res) => {
    letmeauth.getOauth2URL({
        app_id: config.letmeauth.id,
        callback: config.letmeauth.callbackURI,
        scopes: config.letmeauth.scopes,
        prompt: 'none',
        response_type: 'code'
    })
    .then((r) => {
        return res.redirect(r.url)
    })
})
router.get("/login/callback", async (req, res) => {
    res.cookie("token", req.query.token)
    return res.redirect(req.cookies.redirect ? req.cookies.redirect : '/')
})

module.exports = router;