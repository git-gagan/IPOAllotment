import express from "express";
import { registerStep1 } from '../controllers/users/index.js'

export const userRouter = express.Router()
userRouter.get('/register-step1/', registerStep1)