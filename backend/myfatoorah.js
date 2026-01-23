// backend/myfatoorah.js
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.MYFATOORAH_API_KEY;
const BASE_URL = process.env.MYFATOORAH_BASE_URL;

const myfatoorah = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Create Invoice (SendPayment)
// https://myfatoorah.readme.io/docs/send-payment
async function createInvoice(data) {
  try {
    const response = await myfatoorah.post('/v2/SendPayment', data);
    return response.data;
  } catch (error) {
    console.error('MyFatoorah Create Invoice Error:', error.response?.data || error.message);
    throw error;
  }
}

// Get Payment Status
// https://myfatoorah.readme.io/docs/get-payment-status
async function getPaymentStatus(paymentId) {
  try {
    const response = await myfatoorah.post('/v2/GetPaymentStatus', {
      Key: paymentId,
      KeyType: 'PaymentId'
    });
    return response.data;
  } catch (error) {
     console.error('MyFatoorah Get Payment Status Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createInvoice,
  getPaymentStatus
};
