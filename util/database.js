import Sequelize from "sequelize";

const sequelize = new Sequelize("node-complete", "root", "091002", {
    dialect: "mysql",
    host: "localhost",
    logging: false,
});

export default sequelize;
