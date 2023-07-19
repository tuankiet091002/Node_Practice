import bodyParser from "body-parser";
import flash from "connect-flash";
import SequelizeStore from "connect-session-sequelize";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import express from "express";
import session from "express-session";
import multer from "multer";
import path from "path";

import get404 from "./controllers/error.js";
import isAuth from "./middleware/is-auth.js";
import Cart from "./models/cart.js";
import CartItem from "./models/cart-item.js";
import Order from "./models/order.js";
import OrderItem from "./models/order-item.js";
import Product from "./models/product.js";
import User from "./models/user.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shop.js";
import sequelize from "./util/database.js";

const app = express();
const SqlizeStore = SequelizeStore(session.Store);
const {
    doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
    getSecret: () => "balldeep",
    getTokenFromRequest: (req) => req.body.csrfToken,
});

// immage store config
const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        callback(
            null,
            `${Date.now()}-${file.originalname}`
        );
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
// save all file with name image to images folder
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
// statically distribute css files
app.use(express.static(path.join(".", "public")));
// statically distribute image files
app.use("/images", express.static(path.join(".", "images")));

app.use(
    session({
        secret: "balldeep",
        store: new SqlizeStore({
            db: sequelize,
        }),
        resave: false,
        saveUninitialized: false,
    })
);
app.use(cookieParser());
app.use(doubleCsrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    return User.findByPk(req.session.user.id)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => console.log(err));
});

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
});

app.use("/admin", isAuth, adminRoutes);
app.use("/", shopRoutes);
app.use(authRoutes);

app.use(get404);
// sequelize associations
Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
    .sync()
    .then(() => {
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    });
