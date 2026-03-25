import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMe } from '../controllers/me.js';

const router = Router();

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Retorna perfil do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Não autenticado
 */
router.get('/', authMiddleware, getMe);

export default router;
