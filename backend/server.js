// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client (Service Role for Admin updates)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/admin/delete-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'الرمز المميز مفقود.' });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'جلسة غير صالحة. يرجى تسجيل الدخول.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'لا تملك صلاحية الإدارة.' });
    }

    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'معرّف المستخدم مطلوب.' });
    }

    if (userId === userData.user.id) {
      return res.status(400).json({ error: 'لا يمكن حذف حسابك الحالي.' });
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return res.status(500).json({ error: 'تعذر حذف المستخدم.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حذف المستخدم.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

