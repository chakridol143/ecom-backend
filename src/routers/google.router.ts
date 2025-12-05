import { Router } from "express";
import { googleAuth } from "../controller/google.controller";

const router = Router();

router.post("/google", googleAuth);

export default router;
