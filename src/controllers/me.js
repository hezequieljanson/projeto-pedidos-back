import { supabaseAdmin } from '../supabase.js';

export async function getMe(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: true, message: 'Profile not found' });

    res.json({ user: req.user, profile });
  } catch (err) {
    next(err);
  }
}
