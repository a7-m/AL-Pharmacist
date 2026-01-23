// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { createInvoice, getPaymentStatus } = require('./myfatoorah');
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

// 1. Create Invoice Endpoint
app.post('/api/create-invoice', async (req, res) => {
  const { user_id, plan, amount, customerName, customerEmail } = req.body;

  if (!user_id || !plan || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Prepare data for MyFatoorah
    // Note: In a real app, you might want to save a pending order in your DB first
    // to get an internal order ID to pass as CustomerReference or similar.
    
    // Using a simple invoice creation payload
    // You should customize 'CallBackUrl' and 'ErrorUrl' to point to your frontend
    const invoiceData = {
      CustomerName: customerName || 'Student',
      NotificationOption: 'LNK',
      InvoiceValue: amount,
      DisplayCurrencyIso: 'EGP',
      CustomerEmail: customerEmail || 'test@example.com',
      CallBackUrl: `${process.env.FRONTEND_URL}/payment-success.html`,
      ErrorUrl: `${process.env.FRONTEND_URL}/payment-failed.html`,
      Language: 'ar',
      CustomerReference: user_id, // Storing user_id to retrieve it easily later if needed, or use Metadata
      UserDefinedField: JSON.stringify({ user_id, plan }) // Custom metadata
    };

    // 2. Call MyFatoorah API
    const result = await createInvoice(invoiceData);
    
    if (result.IsSuccess) {
      // 3. Store pending payment in Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('payments')
        .insert([
          {
            user_id: user_id,
            invoice_id: result.Data.InvoiceId,
            amount: amount,
            plan: plan,
            status: 'pending'
          }
        ]);

      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
        // We still return the payment URL, but log the error. 
        // In a strict system, you might want to fail here.
      }

      return res.json({ paymentUrl: result.Data.InvoiceURL });
    } else {
      return res.status(500).json({ error: result.Message });
    }

  } catch (error) {
    console.error('Create Invoice Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Verify Payment Endpoint
app.get('/api/verify-payment', async (req, res) => {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    // 1. Check status with MyFatoorah
    const result = await getPaymentStatus(paymentId);

    if (result.IsSuccess) {
       const status = result.Data.InvoiceStatus; // 'Paid', 'Pending', 'Expired'
       const invoiceId = result.Data.InvoiceId; // To match with our DB
       
       // user_id might be in CustomerReference or UserDefinedField
       // Let's parse UserDefinedField if valid JSON
       let metaData = {};
       try {
         metaData = JSON.parse(result.Data.UserDefinedField);
       } catch(e) {}
       
       const userId = metaData.user_id;
       const plan = metaData.plan;

       if (status === 'Paid') {
          // 2. Update 'payments' table
          await supabase
            .from('payments')
            .update({ status: 'paid' })
            .eq('invoice_id', invoiceId);

          // 3. Update 'profiles' table to unlock content
          if (userId) {
            // Calculate expiry date (e.g. 1 month from now)
            const paidUntil = new Date();
            paidUntil.setMonth(paidUntil.getMonth() + 1);

            await supabase
              .from('profiles')
              .update({ 
                is_paid: true,
                plan: plan || 'basic',
                paid_until: paidUntil.toISOString()
              })
              .eq('user_id', userId);
          }
          
          return res.json({ success: true, message: 'Payment verified and account updated.' });
       } else {
          // Update status if failed/expired
           await supabase
            .from('payments')
            .update({ status: status.toLowerCase() })
            .eq('invoice_id', invoiceId);
            
           return res.json({ success: false, status: status });
       }

    } else {
      return res.status(500).json({ error: result.Message });
    }

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
