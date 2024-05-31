const conn = require("../db/dbConnection");
const util = require("util");

const Authorized = async (req, res, next) =>{
    const query = util.promisify(conn.query).bind(conn);
    const {token} = req.headers;
    const user = await query("SELECT * FROM users WHERE token = ?",[token])
    if(user[0]){
        next();
    }else{
        res.status(403).json({
            msg: "you are not authorized to access this route !"
        })
    }
}

module.exports = Authorized;