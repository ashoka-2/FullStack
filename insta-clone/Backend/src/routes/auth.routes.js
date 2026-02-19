const express = require('express')

const identifyUser = require('../middlewares/auth.middleware')



const authRouter = express.Router();
const { loginController, registerController,getMeController } = require('../controllers/auth.controller');


authRouter.post('/register', registerController)

authRouter.post('/login', loginController)


authRouter.get('/get-me',identifyUser,getMeController)



module.exports = authRouter;




