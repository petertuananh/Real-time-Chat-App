const express = require('express');
const router = express.Router();
const functions = require("../../utils/functions");
router.get("/", async (req, res) => {
    return res.status(200).json({code : 200, msg : 'Hello world!'})
})
router.use('/guild', require('./guild.js'));

module.exports = router;