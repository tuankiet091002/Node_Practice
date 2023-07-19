import { validationResult } from "express-validator";

import Product from "../models/product.js";
import deleteFile from "../util/file.js";

export function getAddProduct(req, res) {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
}

export function postAddProduct(req, res) {
    const { title, price, description } = req.body;
    const image = req.file;

    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const imageUrl = image.path;

    return req.user
        .createProduct({
            title,
            price,
            imageUrl,
            description,
        })
        .then(() => {
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.log(err);
        });
}

export function getEditProduct(req, res) {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    return req.user
        .getProducts({ where: { id: prodId } })
        .then((products) => {
            const product = products[0];
            if (!product) {
                return res.redirect("/");
            }
            return res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product,
                hasError: false,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch((err) => console.log(err));
}

export function postEditProduct(req, res) {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    return Product.findByPk(prodId)
        .then((product) => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            if (image) {
                deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save();
        })
        .then(() => {
            res.redirect("/admin/products");
        })
        .catch((err) => console.log(err));
}

export function getProducts(req, res) {
    req.user
        .getProducts()
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
            });
        })
        .catch((err) => console.log(err));
}

export function postDeleteProduct(req, res) {
    const prodId = req.body.productId;
    Product.findByPk(prodId)
        .then((product) => {
            deleteFile(product.imageUrl);
            product.destroy();
        })
        .then(() => {
            res.redirect("/admin/products");
        })
        .catch((err) => console.log(err));
}
