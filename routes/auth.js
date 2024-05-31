const router = require("express").Router();
const conn = require("../db/dbConnection");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// LOGIN
router.post(
  "/login",
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("password should be between (8-12) character"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST [manual, express validation]
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF EMAIL EXISTS
      const query = util.promisify(conn.query).bind(conn); // transform query mysql --> promise to use [await/async]
      const user = await query("select * from users where email = ?", [
        req.body.email,
      ]);
      if (user.length == 0) {
        res.status(404).json({
          errors: [
            {
              msg: "email not found !",
            },
          ],
        });
      }

      //CHECK IF ADMIN OR NOT
      const role = await query("select role from users where email = ?", [
        req.body.email,
      ]);
      if (role === 0) {
        res.status(404).json({
          errors: [
            {
              msg: "you are not admin!",
            },
          ],
        });
      }
      //CHECK IF USER ACTIVE OR IN ACTIVE
      const status = await query("select status from users where email = ?", [
        req.body.status,
      ]);
      if (status === 0) {
        res.status(404).json({
          errors: [
            {
              msg: "you are not an active user!",
            },
          ],
        });
      }

      // 3- COMPARE HASHED PASSWORD
      const checkPassword = await bcrypt.compare(
        req.body.password,
        user[0].password
      );
      if (checkPassword) {
        delete user[0].password;
        res.status(200).json(user[0]);
      } else {
        res.status(404).json({
          errors: [
            {
              msg: "password not found !",
            },
          ],
        });
      }
    } catch (err) {
      res.status(500).json({ err: err });
    }
  }
);

// REGISTRATION
router.post(
  "/signup",
  body("name")
    .isString()
    .withMessage("please enter a valid name")
    .isLength({ min: 5, max: 20 })
    .withMessage("name should be between (5-20) character"),
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("password should be between (8-12) character"),
  body("phone")
  .isLength({min: 7, max: 11})
  .withMessage("contact phone should be between 7 & 11 numbers"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST [manual, express validation]
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF EMAIL EXISTS
      const query = util.promisify(conn.query).bind(conn); // transform query mysql --> promise to use [await/async]
      const checkEmailExists = await query(
        "select * from users where email = ?",
        [req.body.email]
      );
      if (checkEmailExists.length > 0) {
        res.status(400).json({
          errors: [
            {
              msg: "email already exists !",
            },
          ],
        });
      }

      // 3- PREPARE OBJECT USER TO -> SAVE
      const userData = {
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        phone: req.body.phone,
        token: crypto.randomBytes(16).toString("hex"), // JSON WEB TOKEN, CRYPTO -> RANDOM ENCRYPTION STANDARD
      };

      // 4- INSERT USER OBJECT INTO DB
      await query("insert into users set ? ", userData);
      delete userData.password;
      res.status(200).json(userData);
    } catch (err) {
      res.status(500).json({ err: err });
    }
  }
);

module.exports = router;