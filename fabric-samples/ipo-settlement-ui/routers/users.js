import express from "express";
import {
    postRegisterStep1, postRegisterStep2,
    registerStep1, registerStep2, logIn, postLogin
} from '../controllers/users/index.js';
import passport from 'passport'
export const userRouter = express.Router()

userRouter.get('/register-step1/', registerStep1)
userRouter.post('/register-step1/', postRegisterStep1)
userRouter.get('/register-step2/', registerStep2)
userRouter.post('/register-step2/', postRegisterStep2)
userRouter.get('/login/', logIn)
userRouter.post('/login/',
    passport.authenticate('local', { failureRedirect: '/users/login' }), postLogin)
