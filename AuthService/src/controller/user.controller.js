const { UserService } = require("../services/index");

const userService = new UserService();

const create = async (req, res) => {
    try {
        const user = await userService.create({
            email: req.body.email,
            password: req.body.password
        });
        return res.status(201).json({
            data: user,
            success: true,
            message: "Successfully created a new user",
            err: {}
        })
    } catch (error) {
        console.log(error);
        return res.status(error.statusCode).json({
            data: {},
            success: false,
            message: error.message,
            err: error.explanation
        })
    }
}


const destroy = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const response = await userService.destroy(id);
        return res.status(201).json({
            data: {},
            success: true,
            message: "Successfully deleted a user",
            err: {}
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to delete user",
            err: error
        })
    }
}


const signIn = async (req, res) => {
    try {
        // console.log(req.body?.email);
        // console.log(req.body?.password);

        const response = await userService.signIn(req.body.email, req.body.password);
        return res.status(201).json({
            data: response,
            success: true,
            message: "Successfully signin a user",
            err: {}
        })
    } catch (error) {
        // console.log(error);
        return res.status(error.statusCode).json({
            data: {},
            success: false,
            message: error.message,
            err: error.explanation
        })
    }
}


const isAuthenticated = async (req, res) => {
    try {
        const token = req.headers['x-access-token'];
        if (!token) {
            return res.status(401).json({
                data: {},
                success: false,
                message: "No token provided",
                err: {}
            });
        }
        const response = await userService.isAuthenticated(token);
        return res.status(200).json({
            data: response,
            success: true,
            message: "User Authenticated and token is valid",
            err: {}
        })
    } catch (error) {
        console.log(error);
        return res.status(401).json({  
            data: {},
            success: false,
            message: "Authentication failed",
            err: error
        });
    }
}


const isAdmin = async (req, res) => {
    try {
        const response = await userService.isAdmin(req.body.id);
        return res.status(200).json({
            data: response,
            success: true,
            message: 'successfully feteched wheater user is admin or not.',
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Something went wrong",
            err: error
        })
    }
}


module.exports = {
    create,
    destroy,
    signIn,
    isAuthenticated,
    isAdmin,
}