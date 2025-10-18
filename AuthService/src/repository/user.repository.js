const ValidationError = require("../utils/validation.error");
const { User, Role } = require("../models/index");
const ClientError = require("../utils/client.error");
const { StatusCodes } = require("http-status-codes")

class UserRepository {

    async create(data) {
        try {
            const user = await User.create(data);
            return user;
        } catch (error) {
            if (error.name === "SequelizeValidationError") {
                throw new ValidationError(error);
            }
            console.log("Somthing went wrong int repository layer");
            throw error;
        }
    }


    async destroy(userId) {
        try {
            const response = await User.destroy({
                where: {
                    id: userId
                }
            });
            return response;
        } catch (error) {
            console.log("Somthing went wrong int repository layer");
            throw error;
        }
    }

    async getById(userId) {
        try {
            const user = await User.findAll({
                attributes: ["id", "email"]
            });
            return user;
        } catch (error) {
            console.log("Somthing went wrong int repository layer");
            throw error;
        }
    }

    async getByEmail(userEmail) {
        try {
            const user = await User.findOne({
                where: {
                    email: userEmail.toLowerCase()
                }
            });
            if (!user) {
                throw new ClientError(
                    'AttributeNotFound',
                    'Invalid email sent in the request',
                    'Please check the email, as there is no record of the email',
                    StatusCodes.NOT_FOUND
                );
            }
            return user;
        } catch (error) {
            console.log(error);
            console.log("Somthing went wrong int repository layer");
            throw error;
        }
    }

    async isAdmin(userId) {
        try {
            const user = await User.findByPk(userId);
            const adminRole = await Role.findOne({
                where: {
                    name: "ADMIN"
                }
            });
            return await user.hasRole(adminRole);
        } catch (error) {
            console.log("Somthing went wrong int repository layer");
            throw error;
        }
    }








    // async getAll() {
    //     try {
    //         const users = await User.findAll();
    //         return users;
    //     } catch (error) {
    //         console.log("Somthing went wrong int repository layer");
    //         throw error;
    //     }
    // }

    // async update(userId, data) {
    //     try {
    //         const user = await User.findByPk(userId);
    //         user.name = data.name;
    //         user.password = data.password;
    //         await user.save();
    //         return user;
    //     } catch (error) {
    //         console.log("Somthing went wrong int repository layer");
    //         throw error;
    //     }
    // }


}

module.exports = UserRepository;