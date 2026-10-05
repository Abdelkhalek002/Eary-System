const router = require("express").Router();
const prisma = require("../db/prisma");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ==================== LOGIN ====================
router.post(
  "/login",
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("password should be between (8-12) character"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF USER EXISTS
      const user = await prisma.user.findUnique({
        where: { email: req.body.email }
      });

      if (!user) {
        return res.status(404).json({
          errors: [{ msg: "email not found !" }]
        });
      }

      // 3- CHECK IF USER IS ACTIVE
      if (user.status === 0) {
        return res.status(403).json({
          errors: [{ msg: "you are not an active user!" }]
        });
      }

      // 4- COMPARE HASHED PASSWORD
      const checkPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!checkPassword) {
        return res.status(404).json({
          errors: [{ msg: "password not found !" }]
        });
      }

      // 5- GENERATE NEW TOKEN & PERSIST TO DB
      const token = crypto.randomBytes(32).toString("hex");
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { token }
      });

      // 6- RETURN USER OBJECT WITHOUT PASSWORD
      delete updatedUser.password;
      return res.status(200).json(updatedUser);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==================== REGISTRATION ====================
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
    .isLength({ min: 7, max: 11 })
    .withMessage("contact phone should be between 7 & 11 numbers"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF EMAIL ALREADY EXISTS
      const checkEmailExists = await prisma.user.findUnique({
        where: { email: req.body.email }
      });

      if (checkEmailExists) {
        return res.status(400).json({
          errors: [{ msg: "email already exists !" }]
        });
      }

      // 3- HASH PASSWORD & GENERATE TOKEN
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const token = crypto.randomBytes(32).toString("hex");

      // 4- INSERT USER INTO DB VIA PRISMA
      const newUser = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          phone: req.body.phone,
          token,
          role: req.body.role !== undefined ? parseInt(req.body.role, 10) : 0,
          status: req.body.status !== undefined ? parseInt(req.body.status, 10) : 1
        }
      });

      delete newUser.password;
      return res.status(201).json(newUser);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;