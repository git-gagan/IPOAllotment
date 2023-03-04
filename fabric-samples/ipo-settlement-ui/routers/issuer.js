import express from "express";
import { launchIpo, issuerDashboard, postLaunchIpo, updateIssuer } from "../controllers/issuer/index.js";


export const issuerRouter = express.Router()

issuerRouter.get('/launch-ipo/', launchIpo)
issuerRouter.get('/issuer-dashboard/', issuerDashboard)
issuerRouter.post('/launch-ipo/', postLaunchIpo)
issuerRouter.post('/update-issuer/', updateIssuer)