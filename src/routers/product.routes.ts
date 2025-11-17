import { Router } from 'express';
import { getAll, getByCategory, getById, searchByName } from '../controller/product.controller';


const router = Router();
router.get('/', getAll);
router.get('/:id', getById);
router.get('/search/:name', searchByName); 
router.get('/category/:categoryId', getByCategory);

export default router;



