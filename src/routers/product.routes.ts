import { Router } from 'express';
import {
  getAll,
  getByCategory,
  getById,
  searchByName
} from '../controller/product.controller';

const router = Router();

// FIRST: exact routes
router.get('/', getAll);

// THEN: specific named routes
router.get('/search/:name', searchByName);
router.get('/category/:categoryId', getByCategory);

// LAST: dynamic route
router.get('/:id', getById);

export default router;
