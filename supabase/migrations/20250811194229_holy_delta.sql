/*
  # Add public access policy for payment transactions

  1. Security Changes
    - Add policy to allow public users to insert payment transactions
    - This enables anonymous users to create payment records during booking process
    
  2. Important Notes
    - This policy allows public insertion which is necessary for the booking flow
    - In production, additional validation should be added to ensure data integrity
*/

-- Allow public users to insert payment transactions
CREATE POLICY "Public can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);