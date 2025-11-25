import { Router } from "express";
import{getAll, getById, getProductsByCategory, getCategoriesWithProducts} from '../controller/category.controller';

const router = Router();
router.get('/', getAll);
router.get('/:id',getById);
router.get('/with-products/all', getCategoriesWithProducts);
router.get('/:id/products', getProductsByCategory);

export default router;