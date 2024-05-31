const router = require("express").Router();
const conn = require("../db/dbConnection");
const admin = require("../middleWare/admin");
const authorized = require("../middleWare/authorize");
const { body, validationResult } = require("express-validator");
const upload = require("../middleWare/uploadAudio");
const util = require("util"); // helper
const fs = require("fs");


// DISPLAY QUESTIONS
router.get('/getQuestions', async (req, res) =>{
    const query = util.promisify(conn.query).bind(conn);
    const questions = await query("SELECT * FROM questions");
    questions.map((question) =>{
        question.audio_file = "http://" + req.hostname + ":4000/" + question.audio_file;
    })
    res.status(200).json(questions);
})

//DISPLAY SPECIFIC QUESTION
router.get('/question/:id', async (req, res) =>{
    const {id} = req.params;
    const query = util.promisify(conn.query).bind(conn);
    const question = await query("SELECT * FROM questions WHERE id = ?", [id]);
    if (!question[0]) {
        res.status(404).json({ ms: "question not found !" });
    }
    question[0].audio_file = "http://" + req.hostname + ":4000/" + question[0].audio_file;
    res.status(200).json(question[0])
})

//CREATE NEW QUESTION
router.post(
        '/add',
        admin,
        upload.single("audio"),
        body("name").isString(), async (req, res) =>{
            // 1- VALIDATION REQUEST [manual, express validation]
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //2- VALIDATE THE AUDIO FILE
            if(!req.file){
                return res.status(400).json({
                    errors: [
                        {
                            msg:"audio file is required"
                        }
                    ]
                })
            }
            //3- SAVING INTO DB
            const question = {
                name: req.body.name,
                audio_file: req.file.filename,
                status: req.body.status
            };
            const sql = "INSERT INTO questions SET ?";
            query(sql, question, (err, result) =>{
                if(err){
                    res.status(400).json(err)
                }
                else{
                    res.status(200).json({
                        msg: "question added"
                    })
                }
            })
        })

//Update Question Data
router.put(
    '/update/:id',
    admin,
    upload.single("audio"),
    body("name").isString(), async (req, res) =>{
        try {
        // 1- VALIDATION REQUEST [manual, express validation]
        const query = util.promisify(conn.query).bind(conn);
        const {id} = req.params;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // 2- CHECK IF QUESTION EXISTS OR NOT
        const question = await query("SELECT * FROM questions WHERE id = ? ",
        [id]
        );
        if(!question[0]){
            res.status(404).json({ msg: "question not found!" })
        }
        

         // 3- PREPARE QUESTION OBJECT
        const questionObj = {
            name: req.body.name,
            status: req.body.status,
        };
        if (req.file) {
            questionObj.audio_file = req.file.filename;
            fs.unlinkSync("./upload/" + question[0].audio_file); // delete old audio
        }

        // 4- UPDATE QUESTION
        await query("UPDATE questions SET ? WHERE id = ?", [questionObj, question[0].id]);
        res.status(200).json({
            msg: "question updated successfully",
        });
    } catch (err) {
        res.status(500).json(err);
    }
    })

//DELETE QUESTION
router.delete(
    "/remove/:id", // params
    admin,
    async (req, res) => {
        try {
        // 1- CHECK IF QUESTION EXISTS OR NOT
        const query = util.promisify(conn.query).bind(conn);
        const question = await query("SELECT * FROM questions WHERE id = ?", [
            req.params.id,
        ]);
        if (!question[0]) {
            res.status(404).json({ ms: "question not found !" });
        }
        // 2- REMOVE QUESTION AUDIO
        fs.unlinkSync("./upload/" + question[0].audio_file); // delete old audio
        await query("DELETE FROM questions where id = ?", [question[0].id]);
        res.status(200).json({
            msg: "question deleted successfully",
        });
        } catch (err) {
        res.status(500).json(err);
        }
    }
);









module.exports = router;