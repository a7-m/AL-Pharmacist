// js/payments.js

const BACKEND_URL = 'http://localhost:3000/api'; // Adjust if deployed

async function initiatePayment(plan, amount) {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        // Store intended plan in storage? Or just redirect
        sessionStorage.setItem('intendedPlan', plan);
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;
    
    // Show loading state, maybe change button text
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = 'جاري التحويل...';
    btn.disabled = true;

    try {
        const response = await axios.post(`${BACKEND_URL}/create-invoice`, {
            user_id: user.id,
            plan: plan,
            amount: amount,
            customerName: user.user_metadata?.name || user.email,
            customerEmail: user.email
        });

        if (response.data.paymentUrl) {
            window.location.href = response.data.paymentUrl;
        } else {
            alert('حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.');
            btn.innerText = originalText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('Payment Error:', error);
        alert('حدث خطأ في الاتصال بالسيرفر.');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function verifyPaymentOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');

    if (!paymentId) {
        // No payment ID, redirect to pricing
        // window.location.href = 'pricing.html';
        return;
    }

    const statusEl = document.getElementById('payment-status');
    const loadingEl = document.getElementById('loading-spinner');
    const successEl = document.getElementById('success-content');
    const errorEl = document.getElementById('error-content');

    try {
        const response = await axios.get(`${BACKEND_URL}/verify-payment?paymentId=${paymentId}`);

        if (loadingEl) loadingEl.style.display = 'none';

        if (response.data.success) {
            if (successEl) successEl.style.display = 'block';
            // Start countdown to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 5000);
        } else {
            if (errorEl) {
                 errorEl.style.display = 'block';
                 const msgEl = document.getElementById('error-message');
                 if(msgEl) msgEl.innerText = `حالة الدفع: ${response.data.status}`;
            }
        }

    } catch (error) {
        console.error('Verification Error:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
             errorEl.style.display = 'block';
             const msgEl = document.getElementById('error-message');
             if(msgEl) msgEl.innerText = 'فشل الاتصال بالسيرفر للتحقق من الدفع.';
        }
    }
}
