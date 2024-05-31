const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ia-project",
    port: '3308'
});

connection.connect((err) =>{
    if(err) throw(err)
    console.log("CONNECTED TO THE DATABASE!");
});
module.exports = connection;
