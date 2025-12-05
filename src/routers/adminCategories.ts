
import express from "express";
import auth from "../middlewares/auth";
import * as categoryController from "../controller/category.controller";
import upload from "../middlewares/upload"; 
import { normalizeImagePath } from "../utils/files";

const router = express.Router();

// Public routes (no auth)
router.get("/", categoryController.getAll);
router.get("/with-products", categoryController.getCategoriesWithProducts);
router.get("/:id", categoryController.getById);
router.get("/:id/products", categoryController.getProductsByCategory);

// Admin-protected routes
router.post(
  "/",
  auth.ensureAdmin,
  upload.single("image_url"), 
  (req, res) => {
    req.body = req.body || {};

    if (req.file && (req.file as Express.Multer.File).filename) {
      req.body.image_url = normalizeImagePath((req.file as Express.Multer.File).filename);
    }

    // optional debug logs — remove in production
    console.log("POST /categories - req.file:", (req.file as any)?.filename);
    console.log("POST /categories - req.body:", req.body);

    return categoryController.create(req, res);
  }
);

router.put(
  "/:id",
  auth.ensureAdmin,
  upload.single("image_url"), 
  (req, res) => {
    req.body = req.body || {};
    if (req.file && (req.file as Express.Multer.File).filename) {
      req.body.image_url = normalizeImagePath((req.file as Express.Multer.File).filename);
    }
    console.log("PUT /categories/:id - req.file:", (req.file as any)?.filename);
    console.log("PUT /categories/:id - req.body:", req.body);
    return categoryController.update(req, res);
  }
);

router.delete("/:id", auth.ensureAdmin, categoryController.remove);

// product-category mapping (admin)
router.get("/product/:productId", auth.ensureAdmin, categoryController.getForProduct);
router.post("/product/:productId/assign", auth.ensureAdmin, categoryController.assign);
router.post("/product/:productId/unassign", auth.ensureAdmin, categoryController.unassign);
router.post("/product/:productId/set", auth.ensureAdmin, categoryController.setForProduct);

export default router;
