import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { listOrders, getOrder, createOrder, updateOrderStatus } from '../controllers/orders.js';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lista pedidos (user vê os seus; admin vê todos)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Não autenticado
 */
router.get('/', authMiddleware, async (req, res, next) => {
  // Verifica se é admin sem bloquear usuários comuns
  const { supabaseAdmin } = await import('../supabase.js');
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', req.user.id)
    .single();
  req.isAdmin = profile?.role === 'admin';
  next();
}, listOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Retorna pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  const { supabaseAdmin } = await import('../supabase.js');
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', req.user.id)
    .single();
  req.isAdmin = profile?.role === 'admin';
  next();
}, getOrder);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Cria novo pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Pedido criado
 *       400:
 *         description: Estoque insuficiente ou dados inválidos
 */
router.post('/', authMiddleware, [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product_id').notEmpty().withMessage('product_id is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1'),
], createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Atualiza status do pedido (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status atualizado
 *       403:
 *         description: Acesso negado
 */
router.patch('/:id/status', authMiddleware, adminMiddleware, [
  body('status').notEmpty().withMessage('Status is required'),
], updateOrderStatus);

export default router;
