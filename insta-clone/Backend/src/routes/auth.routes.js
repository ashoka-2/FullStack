const express = require('express')
const multer = require('multer');
const identifyUser = require('../middlewares/auth.middleware')

const upload = multer({ storage: multer.memoryStorage() });


const authRouter = express.Router();
const { loginController, registerController,getMeController, logoutController, editProfileController } = require('../controllers/auth.controller');


authRouter.post('/register', registerController)

authRouter.post('/login', loginController)


authRouter.get('/get-me',identifyUser,getMeController)

authRouter.post('/logout',logoutController)

authRouter.put('/edit-profile',upload.single("profilePic"), identifyUser, editProfileController);

module.exports = authRouter;




