const { UserRepository } = require("../repository/index");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_KEY } = require("../config/server.config");
const AppError = require("../utils/error.handler");


class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async create(data) {
        try {
            const user = await this.userRepository.create(data);
            return user;
        } catch (error) {

            if (error.name === "SequelizeValidationError") {
                throw error;
            }
            console.log("something went wrong in service layer");
            throw error;
            // throw new AppError(
            //     'serverError',
            //     'Something went wrong in service layer',
            //     'Logical issue found',
            //     500
            // )
        }
    }

    async destroy(id) {
        try {
            const response = await this.userRepository.destroy(id);
            return response;
        } catch (error) {
            console.log("something went wrong in service layer");
            throw error;
        }
    }

    async get(id) {
        try {
            const user = await this.userRepository.get(id);
            return user;
        } catch (error) {
            console.log("something went wrong in service layer");
            throw error;
        }
    }

    async getAll() {
        try {
            const users = await this.userRepository.getAll();
            return users;
        } catch (error) {
            console.log("something went wrong in service layer");
            throw error;
        }
    }

    async update(id, data) {
        try {
            const user = await this.userRepository.update(data);
            return user;
        } catch (error) {
            console.log("something went wrong in service layer");
            throw error;
        }
    }

    async isAuthenticated(token) {
        try {
            const response = this.verifyToken(token);
            if (!response) {
                throw { error: "Invalid token" };
            }

            const user = await this.userRepository.getById(response.id);
            if (!user) {
                throw { error: "No user with the corresponding token exists" }
            }

            return user.id;
        } catch (error) {
            console.log("something went wrong in auth process");
            throw error;
        }
    }

    async signIn(email, plainPassword) {
        // console.log(email);
        // console.log(plainPassword);
        try {
            // step 1 --> fetch the user using the email
            const user = await this.userRepository.getByEmail(email);
            // step 2 --> compare plain password with stored encrypted password
            // console.log("user pass is ", user);

            const passwordMatch = this.checkPassword(plainPassword, user.password);

            if (!passwordMatch) {
                console.log("Password doesn't match");
                throw { error: "Incorrect password" };
            }

            // step 3 --> if passwords matched then create a token and send it to the user
            const newJWT = this.createToken({ email: user.email, id: user.id });
            return newJWT;
        } catch (error) {
            if (error.name === "AttributeNotFound") {
                throw error;
            }
            console.log("something went wrong in signin process");
            throw error;
        }
    }

    createToken(user) {
        try {
            const result = jwt.sign(user, JWT_KEY, { expiresIn: '1h' });
            return result;
        } catch (error) {
            console.log("something went wrong in token creation", error);
            throw error;
        }
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_KEY);
        } catch (error) {
            console.log("something went wrong in token validation", error.message);
            throw { error: "Invalid or expired token" };
        }
    }

    checkPassword(userInputPlainPassword, encryptedPassword) {
        try {
            return bcrypt.compareSync(userInputPlainPassword, encryptedPassword);
        } catch (error) {
            console.log("Something went wrong in password comparision", error);
            throw error;
        }
    }

    async isAdmin(userId) {
        try {
            return this.userRepository.isAdmin(userId);
        } catch (error) {
            console.log("something went wrong in isAdmin process");
            throw error;
        }
    }
}

module.exports = UserService;