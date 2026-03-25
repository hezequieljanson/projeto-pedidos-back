import { supabaseAdmin } from '../supabase.js';
import { validationResult } from 'express-validator';

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function listOrders(req, res, next) {
  try {
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(name, image_url))')
      .order('created_at', { ascending: false });

    if (!req.isAdmin) {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(name, price, image_url))')
      .eq('id', req.params.id);

    if (!req.isAdmin) {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query.single();
    if (error) return res.status(404).json({ error: true, message: 'Order not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });

  const { items } = req.body; // [{ product_id, quantity }]

  try {
    // Fetch products to validate stock and calculate total
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, price, stock, name')
      .in('id', productIds);

    if (pErr) throw pErr;

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Validate stock
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) return res.status(400).json({ error: true, message: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: true, message: `Insufficient stock for "${product.name}"` });
      }
    }

    const total = items.reduce((sum, item) => sum + productMap[item.product_id].price * item.quantity, 0);

    // Create order
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({ user_id: req.user.id, status: 'pending', total })
      .select()
      .single();

    if (oErr) throw oErr;

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: productMap[item.product_id].price,
    }));

    const { error: iErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (iErr) throw iErr;

    // Decrement stock
    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', { product_id: item.product_id, amount: item.quantity });
    }

    res.status(201).json({ ...order, order_items: orderItems });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });

  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: true, message: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: true, message: 'Order not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
