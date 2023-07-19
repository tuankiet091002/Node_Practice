import express from "express";
import { body, check } from "express-validator";

import {
    getLogin,
    getNewPassword,
    getReset,
    getSignup,
    postLogin,
    postLogout,
    postNewPassword,
    postReset,
    postSignup} from "../controllers/auth.js";
import User from "../models/user.js";

const router = express.Router();

router.get("/login", getLogin);

router.post(
    "/login",
    [
        body("email")
            .isEmail()
            .withMessage("Please enter a valid email address.")
            .normalizeEmail(),
        body("password", "Password has to be valid.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
    ],
    postLogin
);

router.get("/signup", getSignup);

router.post(
    "/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email")
            .custom((value) =>
                User.findOne({ where: { email: value } }).then((user) => {
                    if (user) {
                        return Promise.reject(
                            new Error(
                                "Email exists already, please pick a different one."
                            )
                        );
                    }
                    return true;
                })
            )
            .normalizeEmail(),
        body("password", "Please enter a password with at least 5 characters.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords have to match.");
            }
            return true;
        }),
    ],
    postSignup
);

router.post("/logout", postLogout);

router.get("/reset", getReset);

router.post("/reset", postReset);

router.get("/reset/:token", getNewPassword);

router.post("/new-password", postNewPassword);

export default router;
