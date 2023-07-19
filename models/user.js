import Sequelize from "sequelize";

import sequelize from "../util/database.js";

const User = sequelize.define("user", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: Sequelize.STRING,
    resetToken: { type: Sequelize.STRING, defaultValue: null },
    resetTokenExpiration: { type: Sequelize.DATE, defaultValue: null },
});
export default User;
