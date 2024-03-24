import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import {literal} from "sequelize";

import Order from "../models/order.js";
import Product from "../models/product.js";

export function getProducts(req, res) {
    Product.findAll()
        .then((products) => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
            });
        })
        .catch((err) => {
            console.log(err);
        });
}

export function getProduct(req, res) {
    const prodId = req.params.productId;
    Product.findByPk(prodId)
        .then((product) => {
            res.render("shop/product-detail", {
                product,
                pageTitle: product.title,
                path: "/products",
            });
        })
        .catch((err) => console.log(err));
}

export function getIndex(req, res) {
    Product.findAll()
        .then((products) => {
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
            });
        })
        .catch((err) => {
            console.log(err);
        });
}

export function getCart(req, res) {

    req.user
        .getCart()
        .then(cart => cart ? cart
                .getProducts({
                    attributes: {
                        include: [
                            [literal('SUM("product"."price" * "cartItem"."quantity")'), 'total']
                        ]
                    },
                    group: ['product.id', 'cartItem.id']
                })
                .then(products =>
                    res.render("shop/cart", {
                        path: "/cart",
                        pageTitle: "Your Cart",
                        products,
                    })
                )
                .catch((err) => console.log(err))
            : req.user.createCart({})
                .then(() =>
                    res.render("shop/cart", {
                        path: "/cart",
                        pageTitle: "Your Cart",
                        products: []
                    }))
        )
        .catch((err) => console.log(err));
}

export function postCart(req, res) {
    const prodId = req.body.productId;
    let fetchedCart;
    let newQuantity = 1;
    req.user
        .getCart()
        .then((cart) => {
            fetchedCart = cart;
            return cart.getProducts({where: {id: prodId}});
        })
        .then((products) => {
            let product;
            if (products.length > 0) {
                [product] = products;
            }

            if (product) {
                const oldQuantity = product.cartItem.quantity;
                newQuantity = oldQuantity + 1;
                return product;
            }
            return Product.findByPk(prodId);
        })
        .then((product) =>
            fetchedCart.addProduct(product, {
                through: {quantity: newQuantity},
            })
        )
        .then(() => {
            res.redirect("/cart");
        })
        .catch((err) => console.log(err));
}

export function postCartDeleteProduct(req, res) {
    const prodId = req.body.productId;
    req.user
        .getCart()
        .then((cart) => cart.getProducts({where: {id: prodId}}))
        .then((products) => {
            const product = products[0];
            return product.cartItem.destroy();
        })
        .then(() => res.redirect("/cart"))
        .catch((err) => console.log(err));
}

export function postOrder(req, res) {
    let fetchedCart;
    req.user
        .getCart()
        .then((cart) => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then((products) =>
            req.user
                .createOrder()
                .then((order) =>
                    order.addProducts(
                        products.map((product) => {
                            product.orderItem = {
                                quantity: product.cartItem.quantity,
                            };
                            return product;
                        })
                    )
                )
                .catch((err) => console.log(err))
        )
        .then(() => fetchedCart.setProducts(null))
        .then(() => res.redirect("/orders"))
        .catch((err) => console.log(err));
}

export function getOrders(req, res) {
    req.user
        .getOrders({include: ["products"]})
        .then((orders) => {
            res.render("shop/orders", {
                path: "/orders",
                pageTitle: "Your Orders",
                orders,
            });
        })
        .catch((err) => console.log(err));
}

export function getInvoice(req, res) {
    const {orderId} = req.params;

    Order.findOne({
        where: {id: orderId, userId: req.user.id},
        include: ["products"],
    })
        .then((order) => {
            if (!order) {
                res.redirect("/orders");
            }
            const invoiceName = `invoice-${orderId}.pdf`;
            const invoicePath = path.join("invoices", invoiceName);

            // write pdf
            const pdfDoc = new PDFDocument();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename=${invoiceName}`
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text("Invoice", {
                underline: true,
            });
            pdfDoc.text("-----------------------");
            let totalPrice = 0;
            order.products.forEach((prod) => {
                totalPrice += prod.orderItem.quantity * prod.price;
                pdfDoc.fontSize(14).text(`
                        ${prod.title} - ${prod.orderItem.quantity}x$${prod.price}
                    `);
            });
            pdfDoc.text("---");
            pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);

            pdfDoc.end();
        })
        .catch((err) => console.log(err));
}