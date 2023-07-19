import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";
import { Op } from "sequelize";

import User from "../models/user.js";

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key:
            // sendgrid api key here
                "",
        },
    })
);

export function getLogin(req, res) {
    let message = req.flash("error");
    if (message.length > 0) {
        [message] = message;
    } else {
        message = null;
    }

    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: false,
        errorMessage: message,
        validationErrors: [],
    });
}

export function getSignup(req, res) {
    let message = req.flash("error");
    if (message.length > 0) {
        [message] = message;
    } else {
        message = null;
    }

    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Sign Up",
        isAuthenticated: false,
        errorMessage: message,
        oldInput: { email: "", password: "" },
        validationErrors: [],
    });
}

export function getReset(req, res) {
    let message = req.flash("error");
    if (message.length > 0) {
        [message] = message;
    } else {
        message = null;
    }

    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset",
        errorMessage: message,
    });
}

export function postLogin(req, res) {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email,
                password,
            },
            validationErrors: errors.array(),
        });
    }

    return User.findOne({ where: { email } })
        .then((user) => {
            if (!user) {
                return res.status(422).render("auth/login", {
                    path: "/login",
                    pageTitle: "Login",
                    errorMessage: "Invalid email or password.",
                    oldInput: {
                        email,
                        password,
                    },
                    validationErrors: [],
                });
            }

            return bcrypt.compare(password, user.password).then((doMatch) => {
                if (!doMatch) {
                    req.flash("error", "Wrong password.");
                    return res.redirect("/login");
                }
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(() => res.redirect("/"));
            });
        })
        .catch((err) => console.log(err));
}

export function postSignup(req, res) {
    const { email, password } = req.body;
    const error = validationResult(req);

    if (!error.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Sign Up",
            errorMessage: error.array()[0].msg,
            oldInput: { email, password },
            validationErrors: error.array(),
        });
    }

    return bcrypt
        .hash(password, 12)
        .then((hashedPassword) =>
            User.create({ email, password: hashedPassword })
        )
        .then((newUser) => newUser.save())
        .then(() => {
            res.redirect("/login");
            return transporter.sendMail({
                to: "tuankiet091002@gmail.com",
                from: "tuankiet091002@gmail.com",
                subject: "Signup succeeded!",
                html: "<h1>You successfully signed up!</h1>",
            });
        })
        .catch((err) => console.log(err));
}

export function postLogout(req, res) {
    req.session.destroy(() => {
        res.redirect("/");
    });
}

export function postReset(req, res) {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect("/reset");
        }
        const token = buffer.toString("hex");
        return User.findOne({ where: { email: req.body.email } })
            .then((user) => {
                if (!user) {
                    req.flash("error", "No account with that email found.");
                    return res.redirect("/reset");
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(() => {
                res.redirect("/");
                transporter.sendMail({
                    to: "tuankiet091002@gmail.com",
                    from: "tuankiet091002@gmail.com",
                    subject: "Password reset",
                    html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
              `,
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });
}

export function getNewPassword(req, res) {
    const { token } = req.params;
    User.findOne({
        where: {
            resetToken: token,
            resetTokenExpiration: { [Op.gt]: Date.now() },
        },
    })
        .then((user) => {
            if (!user) {
                return res.redirect("/login");
            }
            let message = req.flash("error");

            if (message.length > 0) {
                [message] = message;
            } else {
                message = null;
            }

            return res.render("auth/new-password", {
                path: "/new-password",
                pageTitle: "New Password",
                errorMessage: message,
                userId: user.id,
                passwordToken: token,
            });
        })
        .catch((err) => console.log(err));
}

export function postNewPassword(req, res) {
    const { password, userId, passwordToken } = req.body;

    User.findOne({
        where: {
            resetToken: passwordToken,
            resetTokenExpiration: { [Op.gt]: Date.now() },
            id: userId,
        },
    })
        .then((user) => {
            if (!user) {
                return res.redirect("/login");
            }

            return bcrypt.hash(password, 12).then((hashedPassword) => {
                user.password = hashedPassword;
                user.resetToken = null;
                user.resetTokenExpiration = null;
                return user.save();
            });
        })
        .then(() => res.redirect("/login"))
        .catch((err) => console.log(err));
}
