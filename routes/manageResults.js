const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleWare/authorize");


//DISPLAY SPECIFIC USER RESULTS
router.get('/history/:id', (req, res) =>{
    const userId = req.params.id;
    conn.query("SELECT * FROM results WHERE user_id = ?", userId, (data, error) =>{
        if(error){
            res.json(error)
        }
    })
})

//CREATE RESULT FOR SPECIFIC USER
router.post('/saveAnswers/:id', async (req, res) =>{
    const userId = req.params.id;
    const score = req.body.score
    const sql = "INSERT INTO results (score, date, user_id) VALUES (?, NOW(), ?)";
    conn.query(sql, [score, userId], (err, result) =>{
        if(err){
            res.status(400).json(err)
        }
        else{
            res.status(200).json({
                msg: "new result added successfully"
            })
        }
    })
})



module.exports = router;