import { supabaseAdmin } from '../supabase.js';

export async function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', req.user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }

  req.isAdmin = true;
  next();
}
