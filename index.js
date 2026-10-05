const express = require("express");
const conn = require("./db/dbConnection");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");

// ====================  GLOBAL MIDDLEWARE ====================
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true })); // TO ACCESS URL FORM ENCODED
app.use(express.static("upload"));

// ====================  Required Module ====================
const auth = require("./routes/auth");
const questions = require("./routes/manageQuestions")
const answers = require("./routes/manageAnswers")
const results = require("./routes/manageResults")

// ====================  API ROUTES [ ENDPOINTS ]  ====================
app.use("/auth", auth);
app.use("/questions", questions, answers);
app.use("/results", results);

// ====================  ERROR HANDLER ====================
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON in request body" });
    }
    return res.status(500).json({ error: err.message });
});

// ====================  RUN THE SERVER  ====================
app.listen(4000, () => {
    console.log("server is running on port 4000...");
})


// DISPLAY USERS
app.get('/users', (req, res) => {
    conn.query("SELECT * FROM users", (data, error) => {
        if (error) {
            res.json(error)
        }
    })
})

//DISPLAY SPECIFIC USER PROFILE
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    conn.query("SELECT * FROM users WHERE id = ?", id, (data, error) => {
        if (error) {
            res.json(error)
        }
    })
})
app.get('/admins/:id', (req, res) => {
    const { id } = req.params;
    conn.query("SELECT * FROM users WHERE role = 1 AND id= ?", id, (data, error) => {
        if (error) {
            res.json(error)
        }
    })
})

//Update USER PROFILE
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body
    const password = await bcrypt.hash(req.body.password, 10);
    // const password = req.body.password;
    conn.query("UPDATE users SET name = ?, password = ?, phone = ? WHERE id = ?", [name, password, phone, id], (data, error) => {
        if (error) {
            console.log(error)
        }
    })
})
app.put('/admins/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body
    const password = await bcrypt.hash(req.body.password, 10);
    conn.query("UPDATE users SET name = ?, password = ? WHERE role = 1 AND id= ?", [name, password, id], (data, error) => {
        if (error) {
            console.log(error)
        }
        // console.log(data);
    })
})

//ADD NEW USER
app.post('/users', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = await bcrypt.hash(req.body.password, 10);
    const phone = req.body.phone;
    const status = req.body.status;
    const sql = "INSERT INTO users (name, email, password, phone, status) VALUES (?, ?, ?, ?, ?)";
    conn.query(sql, [name, email, password, phone, status], (err, result) => {
        if (err) {
            res.status(400).json(err)
        }
        else {
            res.send(result)
        }
    })
})

//UPDATE SPECIFIC USER
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    conn.query("SELECT * FROM users WHERE id = ?", id, (data, error) => {
        if (error) {
            res.json(error)
        }
    })
})
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, status } = req.body
    const password = await bcrypt.hash(req.body.password, 10);
    // const password = req.body.password;
    conn.query("UPDATE users SET name = ?, email = ?, password = ?, phone = ?, status = ? WHERE id = ?", [name, email, password, phone, status, id], (data, error) => {
        if (error) {
            console.log(error)
        }
    })
})

//DELETE USER
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM users WHERE id = ?";
    conn.query(sql, id, (err, result) => {
        if (err) {
            res.status(400).json(err)
        }
    })
})
