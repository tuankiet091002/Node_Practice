import Sequelize from "sequelize";

//mysql db authentication here
const sequelize = new Sequelize("", "", "", {
    dialect: "mysql",
    host: "localhost",
    logging: false,
});

export default sequelize;
