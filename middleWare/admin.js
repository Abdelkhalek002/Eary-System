const conn = require("../db/dbConnection");
const util = require("util");

const admin = async (req, res, next) =>{
    const query = util.promisify(conn.query).bind(conn);
    const {token} = req.headers;
    const admin = await query("SELECT * FROM users WHERE token = ?",[token])
    if(admin[0] && admin[0].role == '1'){
        next();
    }else{
        res.status(403).json({
            msg: "you are not authorized to access this route !"
        })
    }
}

module.exports = admin;