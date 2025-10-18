// In middleware i will find clients mistakes
const validateUserAuth = async (req, res, next) => {
    try {
        if (!req.body?.email || !req.body?.password) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Something went wrong",
                err: "Email or Password are missing in the request"
            })
        }
        next();
    } catch (error) {
        console.log("Something went wrong in validate User auth process");
        throw error;
    }
}

const validateIsAdminRequest = async (req, res, next) => {
    try {
        if (!req.body?.id) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Something went wrong",
                err: "UserId is missing in the request"
            })
        }
        next();
    } catch (error) {
        console.log("Something went wrong in validate User isAdmin process");
        throw error;
    }
}

module.exports = {
    validateUserAuth,
    validateIsAdminRequest,
};