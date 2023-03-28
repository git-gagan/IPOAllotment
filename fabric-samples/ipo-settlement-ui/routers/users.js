import express from "express";
import passport from "passport";
import {
  logIn,
  postLogin,
  postRegisterInvestorStep3,
  postRegisterStep1,
  postRegisterStep2,
  registerInvestorStep3,
  registerStep1,
  registerStep2,
  investorDashboard,
  profile,
  portfolio,
  appliedIpo,
  upcomingIpo,
  apply,
  applyIpoGet,
  applyIpoPost,
  alterBid,
  addDematPost,
} from "../controllers/users/index.js";

export const userRouter = express.Router();

userRouter.get("/register-step1/", registerStep1);
userRouter.post("/register-step1/", postRegisterStep1);
userRouter.get("/register-step2/", registerStep2);
userRouter.post("/register-step2/", postRegisterStep2);
userRouter.get("/register-step3/", registerInvestorStep3);
userRouter.post("/register-investor-step3/", postRegisterInvestorStep3);
userRouter.get("/login/", logIn);
userRouter.post(
  "/login/",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
  }),
  postLogin
);
userRouter.get("/investor-dashboard/", investorDashboard);
userRouter.get("/profile/", profile);
userRouter.get("/portfolio/", portfolio);
userRouter.get("/applied-ipo/", appliedIpo);
userRouter.get("/upcoming-ipo/", upcomingIpo);
userRouter.post("/apply/", apply);
userRouter.get("/apply-ipo/", applyIpoGet);
userRouter.post("/apply-ipo/", applyIpoPost);
userRouter.post("/alter-bid/", alterBid);
userRouter.post("/add-demat/", addDematPost);
