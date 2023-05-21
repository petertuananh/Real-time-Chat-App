const express = require('express');
const { checkAuth, guildValidation } = require('../utils/functions');
const router = express.Router();
const functions = require("../utils/functions");
const { con } = require("../utils/mysql")
router.get("/", async (req, res) => {
    return res.send('Hello world!')
})
router.get("/home", checkAuth, async (req, res) => {
    return res.render("pages/home")
})
router.get("/guild/:guildId", checkAuth, guildValidation, async (req, res) => {
    con.query(`SELECT * FROM GUILD WHERE id=${req.params.guildId}`,async function (err, guild) {
        con.query(`SELECT * FROM CHANNEL WHERE guildId=${req.params.guildId}`,async function (err, channels) {
            return res.render("pages/guild", {
                guild : guild,
                channels : channels
            })
        })
    })
})

router.get("/guild/:guildId/:type/:target", checkAuth, guildValidation, async (req, res) => {
    con.query(`SELECT * FROM GUILD WHERE id=${req.params.guildId}`,async function (err, guild) {
        con.query(`SELECT * FROM CHANNEL WHERE guildId=${req.params.guildId}`,async function (err, channels) {
            return res.render("pages/channel", {
                guild : guild,
                channels : channels
            })
        })
    })
})
module.exports = router;