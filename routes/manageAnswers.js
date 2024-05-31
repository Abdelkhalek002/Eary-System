const router = require("express").Router();
const conn = require("../db/dbConnection");
const admin = require("../middleWare/admin");
const util = require("util"); // helper
const fs = require("fs");

//DISPLAY All ANSWERS
router.get('/answers', (req, res) =>{
    conn.query("SELECT * FROM answers", (data, error) =>{
        if(error){
            res.json(error)
        }
    })
})

//DISPLAY SPECIFIC QUESTION ANSWERS
router.get('/:id/answers', (req, res) =>{
    const questionId = req.params.id;
    conn.query("SELECT * FROM answers WHERE question_id = ?", questionId, (data, error) =>{
        if(error){
            res.json(error)
        }
    })
})

//CREATE ANSWER FOR SPECIFIC QUESTION
router.post('/:id/createAnswer', async (req, res) =>{
        const questionId = req.params.id;
        const description = req.body.description
        const priority = req.body.priority
        const sql = "INSERT INTO answers (description, priority, question_id) VALUES (?, ?, ?)";
        conn.query(sql, [description, priority, questionId], (err, result) =>{
            if(err){
                res.status(400).json(err)
            }
            else{
                res.status(200).json({
                    msg: "answer added"
                })
            }
        })
    })

//DELETE ANSWER FROM SPECIFIC QUESTION 
router.delete(
        "/removeAnswer/:id", 
        async (req, res) => {
            const query = util.promisify(conn.query).bind(conn);
            const answer = await query("SELECT * FROM answers WHERE id = ?", [
                req.params.id,
            ]);
            if (!answer[0]) {
                res.status(404).json({ ms: "answer not found !" });
            }
            await query("DELETE FROM answers WHERE id = ?", [answer[0].id]);
            res.status(200).json({
                msg: "answer deleted successfully",
            });
})

module.exports = router;