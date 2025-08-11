import { loadStripe } from '@stripe/stripe-js';

// This is a demo Stripe publishable key - replace with your actual key
const stripePromise = loadStripe('pk_test_51234567890abcdef');

export const createPaymentIntent = async (amount: number, currency: string = 'inr') => {
  // In a real application, this would call your backend API
  // For demo purposes, we'll simulate a successful payment intent
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        client_secret: 'pi_test_' + Date.now() + '_secret_test',
        id: 'pi_test_' + Date.now(),
        amount: amount * 100, // Stripe uses cents
        currency,
        status: 'requires_payment_method'
      });
    }, 1000);
  });
};

export const confirmPayment = async (clientSecret: string, paymentMethod: any) => {
  // Simulate payment confirmation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paymentIntent: {
          id: 'pi_test_' + Date.now(),
          status: 'succeeded',
          amount: 50000, // ₹500 in paise
          currency: 'inr'
        },
        error: null
      });
    }, 2000);
  });
};

export default stripePromise;