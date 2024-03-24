import Sequelize from "sequelize";

// mysql db authentication here
const sequelize = new Sequelize("dbms_ecommerce", "postgres", "091002", {
    dialect: "postgres",
    host: "localhost",
    port: 5432,
    logging: console.log
});

export default sequelize;
