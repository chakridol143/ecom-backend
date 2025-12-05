import express from "express";
import { login } from "../controller/login.controller";
import { register } from "../controller/register.controller";
import { adminLogin } from "../controller/adminLogin";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/admin/login", adminLogin);

export default router;
