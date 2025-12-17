import { Router } from "express";
import { googleRegister } from "../controller/googleAuth.controller";

const router = Router();

router.post("/google", googleRegister);

export default router;
