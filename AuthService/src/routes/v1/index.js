const express = require("express");
const UserController = require("../../controller/user.controller");
const { AuthRequestValidator } = require("../../middleware/index");

const router = express.Router();



router.post('/signup',
    AuthRequestValidator.validateUserAuth,
    UserController.create
);
router.post(
    '/signin',
    AuthRequestValidator.validateUserAuth,
    UserController.signIn
);

router.get(
    '/isAuthenticated',
    UserController.isAuthenticated
)
router.delete(
    '/delete/:id',
    UserController.destroy
);
router.get(
    '/isAdmin',
    AuthRequestValidator.validateIsAdminRequest,
    UserController.isAdmin
)


module.exports = router;

