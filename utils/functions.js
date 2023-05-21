const letmeauth = require("letmeauth");
const config = require("../config.json")
const { con } = require("../utils/mysql")
module.exports = {
    checkAuth: async function (req, res, next) {
        if (req.session.user) {
            return next()
        } else {
            letmeauth.checkToken({
                token: req.cookies.token,
                app_id: config.letmeauth.id,
                client_secret: config.letmeauth.secret
            })
            .then(async result => {
                if (result.error) {
                    console.log(result.error)
                } else if (result.user) {
                    req.session.user = result.user
                    return next()
                }
                return res.redirect("/login")
            })
        }
    },
    guildValidation: async function (req, res, next) {
        con.query(`SELECT * FROM USER_GUILDS WHERE userId=${req.session.user.id} && guildId=${req.params.guildId}`,async function (err, member) {
            if (!member) return res.redirect("/home");
            if (!member[0]) return res.redirect("/home");
            return next()
        })
    }
};