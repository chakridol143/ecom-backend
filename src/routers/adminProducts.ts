
import express from "express";
import { uploadFields } from "../middlewares/upload";
import auth from "../middlewares/auth";
import * as productController from "../controller/product.controller";
import { normalizeImagePath } from "../utils/files"; 

const router = express.Router();
router.use(auth.ensureAdmin);

router.get("/", productController.getAll);
router.get("/:id", productController.getById);

// create: multer -> map filenames into req.body -> controller.create
router.post("/", uploadFields, (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  if (files) {
    if (files.image_url) req.body.image_url = normalizeImagePath(files.image_url[0].filename);
    if (files.image_url1) req.body.image_url1 = normalizeImagePath(files.image_url1[0].filename);
    if (files.image_url2) req.body.image_url2 = normalizeImagePath(files.image_url2[0].filename);
    if (files.image_url3) req.body.image_url3 = normalizeImagePath(files.image_url3[0].filename);
    if (files.image_url4) req.body.image_url4 = normalizeImagePath(files.image_url4[0].filename);
  }
  return productController.create(req, res);
});

// update
router.put("/:id", uploadFields, (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  if (files) {
    if (files.image_url) req.body.image_url = normalizeImagePath(files.image_url[0].filename);
    if (files.image_url1) req.body.image_url1 = normalizeImagePath(files.image_url1[0].filename);
    if (files.image_url2) req.body.image_url2 = normalizeImagePath(files.image_url2[0].filename);
    if (files.image_url3) req.body.image_url3 = normalizeImagePath(files.image_url3[0].filename);
    if (files.image_url4) req.body.image_url4 = normalizeImagePath(files.image_url4[0].filename);
  }
  return productController.update(req, res);
});

router.delete("/:id", productController.remove);

export default router;
