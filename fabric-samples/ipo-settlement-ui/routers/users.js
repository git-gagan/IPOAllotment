import express from "express";
import { registerStep1, postRegisterStep1, registerStep2 } from '../controllers/users/index.js'

export const userRouter = express.Router()
userRouter.get('/register-step1/', registerStep1)
userRouter.post('/register-step1/', postRegisterStep1)
userRouter.get('/register-step2/', registerStep2)