import express from "express";
import { body } from "express-validator";

import {
    getAddProduct,
    getEditProduct,
    getProducts,
    postAddProduct,
    postDeleteProduct,
    postEditProduct,
} from "../controllers/admin.js";

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", getAddProduct);

// /admin/products => GET
router.get("/products", getProducts);

// /admin/add-product => POST
router.post(
    "/add-product",
    [
        body("title").isString().isLength({ min: 3 }).trim(),
        body("price").isFloat(),
        body("description").isLength({ min: 5, max: 400 }).trim(),
    ],
    postAddProduct
);

router.get("/edit-product/:productId", getEditProduct);

router.post(
    "/edit-product",
    [
        body("title").isString().isLength({ min: 3 }).trim(),
        body("price").isFloat(),
        body("description").isLength({ min: 5, max: 400 }).trim(),
    ],
    postEditProduct
);

router.post("/delete-product", postDeleteProduct);

export default router;
