import { supabaseAdmin } from '../supabase.js';
import { validationResult } from 'express-validator';

export async function listProducts(req, res, next) {
  try {
    const { category, search, price_min, price_max } = req.query;

    let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    if (price_min) query = query.gte('price', Number(price_min));
    if (price_max) query = query.lte('price', Number(price_max));

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: true, message: 'Product not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });

  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({ name, description, price, stock, category, image_url })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });

  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ name, description, price, stock, category, image_url, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: true, message: 'Product not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ error: true, message: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
