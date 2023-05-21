const express = require('express');
const router = express.Router();
const functions = require("../../utils/functions");
const { con } = require("../../utils/mysql")
const randomstring = require("randomstring");
const snowflake = require('nodejs-snowflake');

router.post("/create", functions.checkAuth, async (req, res) => {
    if (req.body.name) {
        const gid = new snowflake.Snowflake({
            returnNumber: true
        }); 
        const guildId = gid.idFromTimestamp();
        await con.query(`INSERT INTO GUILD(id, name, ownerId, icon, banner, flags, createAt) VALUES (${guildId}, "${req.body.name}", ${req.session.user.id}, 0, 0, 0, ${Date.now()})`)
        await con.query(`INSERT INTO USER_GUILDS(userId, guildId, nickname, permissions, joinedAt) VALUES (${req.session.user.id}, ${guildId}, 0, 8, ${Date.now()})`)
        // return res.status(200).json({
        //     id : parseInt(guildId),
        //     name : req.body.name
        // })
        return res.redirect(`/guild/${guildId}`)
    } else {
        return res.status(400).json({code : 400, msg : 'Missing required data'})
    }
})

router.get("/:guildId/:type/:target", functions.checkAuth, functions.guildValidation, async (req, res) => {
    if (req.params.type == 'channel')
})

module.exports = router;