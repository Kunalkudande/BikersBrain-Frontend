// Razorpay Helper

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  /** Enable Razorpay Magic Checkout (1CC) — collects contact, address & payment */
  oneClickCheckout?: boolean;
  onSuccess: (response: RazorpayResponse) => void;
  onFailure: (error: any) => void;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Load Razorpay script dynamically
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      // Script tag exists but Razorpay not yet available — wait for it
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Open Razorpay payment modal
export async function openRazorpayCheckout({
  orderId,
  amount,
  currency = 'INR',
  name = 'BikersBrain',
  description = 'Helmet & Riding Gear Purchase',
  prefill,
  oneClickCheckout = false,
  onSuccess,
  onFailure,
}: RazorpayOptions): Promise<void> {
  const loaded = await loadRazorpayScript();

  if (!loaded) {
    onFailure(new Error('Failed to load Razorpay SDK. Check your internet connection.'));
    return;
  }

  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!key) {
    onFailure(new Error('Payment gateway not configured. Contact support.'));
    return;
  }

  const options: any = {
    key,
    amount,
    currency,
    name,
    description,
    order_id: orderId,
    prefill: {
      name: prefill?.name || '',
      email: prefill?.email || '',
      contact: prefill?.contact || '',
    },
    theme: {
      color: '#f97316',
    },
    modal: {
      ondismiss: () => {
        onFailure(new Error('Payment cancelled by user'));
      },
      confirm_close: true,
      escape: true,
    },
    handler: (response: RazorpayResponse) => {
      onSuccess(response);
    },
  };

  // Enable Razorpay Magic Checkout (1CC) — Contact → Address → Payment
  if (oneClickCheckout) {
    options.one_click_checkout = true;
  } else {
    // Standard checkout: show UPI + other payment blocks
    options.config = {
      display: {
        blocks: {
          upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
          other: {
            name: 'Other Methods',
            instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
            ],
          },
        },
        sequence: ['block.upi', 'block.other'],
        preferences: { show_default_blocks: true },
      },
    };
  }

  try {
    const rzp = new window.Razorpay(options);
    console.log('Opening Razorpay:', { key: key?.slice(0, 8) + '...', amount, order_id: orderId });
    rzp.on('payment.failed', (response: any) => {
      const err = response.error;
      console.error('Razorpay payment.failed:', err);
      onFailure(err);
    });
    rzp.open();
  } catch (err) {
    console.error('Razorpay open error:', err);
    onFailure(err);
  }
}
