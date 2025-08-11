import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment or settings
let stripePromise: Promise<any> | null = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    // Try to get from environment first
    let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    // If not in environment, try to get from database settings
    if (!publishableKey) {
      try {
        const { supabase } = await import('./supabase');
        const { data } = await supabase
          .from('clinic_settings')
          .select('setting_value')
          .eq('setting_key', 'stripe_publishable_key')
          .single();
        
        publishableKey = data?.setting_value;
      } catch (error) {
        console.warn('Could not load Stripe key from settings');
      }
    }
    
    // Fallback to test key if nothing found
    if (!publishableKey) {
      publishableKey = 'pk_test_51234567890abcdef'; // This should be replaced with actual key
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

export const createPaymentIntent = async (amount: number, currency: string = 'inr', metadata: any = {}) => {
  try {
    // In a real application, this would call your backend API
    // For now, we'll simulate the payment intent creation
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents/paise
        currency,
        metadata
      }),
    });

    if (!response.ok) {
      // Fallback for demo - simulate successful payment intent
      return {
        client_secret: 'pi_test_' + Date.now() + '_secret_' + Math.random().toString(36).substr(2, 9),
        id: 'pi_test_' + Date.now(),
        amount: amount * 100,
        currency,
        status: 'requires_payment_method'
      };
    }

    return await response.json();
  } catch (error) {
    console.warn('Payment intent creation failed, using demo mode:', error);
    // Fallback for demo
    return {
      client_secret: 'pi_test_' + Date.now() + '_secret_' + Math.random().toString(36).substr(2, 9),
      id: 'pi_test_' + Date.now(),
      amount: amount * 100,
      currency,
      status: 'requires_payment_method'
    };
  }
};

export const confirmPayment = async (clientSecret: string, paymentMethodData: any) => {
  try {
    const stripe = await getStripePromise();
    
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    // For demo purposes, simulate successful payment
    if (clientSecret.includes('test')) {
      return {
        paymentIntent: {
          id: clientSecret.split('_secret_')[0],
          status: 'succeeded',
          amount: 50000, // ₹500 in paise
          currency: 'inr'
        },
        error: null
      };
    }

    // Real Stripe confirmation
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodData
    });

    return result;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Payment failed'
      }
    };
  }
};

export const createPaymentMethod = async (cardElement: any) => {
  try {
    const stripe = await getStripePromise();
    
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      return { error };
    }

    return { paymentMethod };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create payment method'
      }
    };
  }
};

export default getStripePromise;