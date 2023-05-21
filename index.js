const config = require("./config.json")
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var port = config.server.port;
var bodyParser = require('body-parser');
const crypto = require("crypto");
const { Server } = require("socket.io");
const { con } = require("./utils/mysql.js")
const session = require("express-session")
const letmeauth = require("letmeauth")
app.use(bodyParser.urlencoded({
   extended: false
}));
// chuyển sang gửi tin nhắn bằng api, socket cứ iện msg lên bth
app.use(bodyParser.json()); 
app.use(require('cookie-parser')());
const io = new Server(server)
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});
app.use(session({ secret: '*$*&$*#&$%_(($(%*$%)*$(*$&(*$%&(*$%&*(%$&', cookie: { maxAge: 60000 }}))
const ms = require("ms")
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
const dataDir = path.resolve(`${process.cwd()}${path.sep}views`);
app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)))
app.locals.ms = ms

// Routes
app.use('/', require('./routes/index.js'));
app.use('/api', require('./routes/api/index.js'));
app.use('/auth', require('./routes/auth.js'));





app.use((req, res) => {
    return res.status(404).json({code: 404, msg: 'Unknown request'})
})
const checkAuth = async (req, res, next) => {
    if (req.session.user) {
        return next()
    } else {
        letmeauth.checkToken({
            token: req.cookies.token,
            app_id: '95716779970129948',
            client_secret: 'aHJDvXFZNlNuwBnsVpCaMwdXnOQram'
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
};

app.get('/chat/:roomID', checkAuth, async function(req, res) {
    const tokenCookie = req.cookies.token
    const roomID = req.params.roomID
    con.query(`SELECT * FROM user WHERE token="${tokenCookie}"`,async function (err, user) {
        con.query(`SELECT * FROM userinroom WHERE userId=${user[0].id} && guildId=${roomID}`,async function (err, room) {
            con.query(`SELECT * FROM room WHERE id=${roomID}`,async function (err, roomO) {
            if (!room[0]) {
                return res.render('pages/error', {
                    error: `Can't find your room: ${roomID}!`,
                    backURL: `/chat`
                });
            } else {
                res.render('pages/chat', {
                    room: `${roomID}`,
                    token: tokenCookie,
                    user: user[0].username,
                    invite: roomO[0].invite
                });
            }
            })
        })
        con.query(`SELECT * FROM userinroom WHERE userId=${user[0].id}`,async function (err, room) {
            // console.log(room[0].guildId)
            // room[0].guildId.forEach(async guild=>{
            //     console.log(guild)
            // })
            let items = Object.keys(room)

            let content = items.map(r => r)
            .map((r, i) => `${room[items[i]].guildId}`)
            .join("\n");

            app.locals.guilds = content
 
        })
    })
    
})


io.on('connection', (socket) => {
    socket.on(`chatmessage`, data => {
        con.query(`SELECT * FROM user WHERE token="${data.token}"`,async function (err, user) {
            data.name = user[0].username
            io.emit(`user-chat${data.room}`, data)
        })
    })
})
app.get('/invite/:invite',checkAuth, async function(req, res) {
    const invite = req.params.invite
    const tokenCookie = req.cookies.token
    con.query(`SELECT * FROM user WHERE token="${tokenCookie}"`,async function (err, user) {
        con.query(`SELECT * FROM room WHERE invite="${invite}"`,async function (err, invite) {
            if (!invite[0]) {
                return res.render('pages/error', {
                    error: `Invalid invite link!`,
                    backURL: `/home`
                });
            } else {
                await con.query(`INSERT INTO userinroom(userId, guildId, nickname, perm) VALUES (${user[0].id}, ${invite[0].id}, 0, 1)`)
                return res.redirect(`/chat/${invite[0].id}`)
            }
        })
    })
})
app.get('/room/:action',checkAuth, async function(req, res) {
    const action = req.params.action
    const tokenCookie = req.cookies.token
    const roomID = req.query.id
    con.query(`SELECT * FROM user WHERE token="${tokenCookie}"`,async function (err, user) {

    if (action == 'create') {
            const roomID = `${makeInteger(17)}`
            await con.query(`INSERT INTO room(id, ownerId, privacy, memberCount, chatStreak, invite) VALUES (${roomID}, ${user[0].id}, "private", 1, 0, "${makeString(5)}")`)
            await con.query(`INSERT INTO userinroom(userId, guildId, nickname, perm) VALUES (${user[0].id}, ${roomID}, 0, 8)`)
            return res.redirect(`/chat/${roomID}`)
    } else if (action == 'delete') {
        con.query(`SELECT * FROM userinroom WHERE userId=${user[0].id} && guildId=${roomID}`,async function (err, room) {
            if (!room[0]) {
                return res.render('pages/error', {
                    error: `Can't find your room: ${roomID}!`,
                    backURL: `/chat`
                });
            } else {
                if (room[0].perm !== 8) {
                    return res.render('pages/error', {
                        error: `Missing permission!`,
                        backURL: `/home`
                    });
                } else {
                    await con.query(`DELETE FROM room WHERE (id)=${roomID}`)
                    await con.query(`DELETE FROM userinroom WHERE (guildId)=${roomID}`)
                    return res.redirect(`/home`)
                }
            }
        })
    }
    })

})
app.get('/login', async function(req, res) {
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
app.get('/login/callback', async function(req, res) {
    res.cookie("token", req.query.token)
    return res.redirect(req.cookies.redirect ? req.cookies.redirect : '/')
})

app.get('/', checkAuth, async function(req, res) {
    res.redirect(`/home`)
});
app.get('/home', checkAuth, async function(req, res) {
    res.render(`pages/home`)
});
// app.get('/chat', checkAuth, async function(req, res) {
//     const room = req.query.room
//     res.render('pages/chat');
// });
// cứ 1 room chat thì tạo 1 table mysql mới




async function sendMail(subject, title, content, to) {
    var content = '';
    content += `
        <div style="padding: 10px; background-color: #003375">
            <div style="padding: 10px; background-color: white;">
                <h4 style="color: #0085ff">${title}</h4>
                <span style="color: black">${content}</span>
            </div>
        </div>
    `;
    var mainOptions = {
        to: to,
        subject: subject,
        html: content
    }
    transporter.sendMail(mainOptions, function(err, info){
        if (err) {
            console.log(err)
        } else {
            
        }
    });
}
function makeString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function makeInteger(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}