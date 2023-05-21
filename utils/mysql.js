const mysql = require("mysql");
const login = require("../config.json");

const config = {
    host: login.database.mysql.host,
    user: login.database.mysql.user,
    password: login.database.mysql.password,
    database: login.database.mysql.database,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: true,
    charset: "utf8mb4_general_ci",
    connectionLimit: 1
}

const pool = mysql.createPool(config)
exports.con = pool;
exports.mysql = mysql;
 


// var mysql = require('mysql');

// var con = mysql.createConnection({
//     host: login.database.mysql.host,
//     user: login.database.mysql.user,
//     password: login.database.mysql.password,
//     database: login.database.mysql.database,
// });

// con.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
// });