/*
  # Add maintenance mode and payment settings

  1. New Settings
    - Add maintenance mode toggle
    - Add maintenance message
    - Add auto refresh interval
    - Add Stripe payment settings
    - Add online payments toggle

  2. Security
    - Settings are managed through existing RLS policies
*/

-- Insert maintenance and payment settings
INSERT INTO clinic_settings (setting_key, setting_value, setting_type, description) VALUES
  ('maintenance_mode', 'false', 'general', 'Enable maintenance mode to prevent new bookings'),
  ('maintenance_message', '"System is under maintenance. Please try again later."', 'general', 'Message to show when maintenance mode is enabled'),
  ('auto_refresh_interval', '30', 'general', 'Auto refresh interval in seconds for admin dashboard'),
  ('stripe_publishable_key', '"pk_test_51234567890abcdef"', 'payment', 'Stripe publishable key for payments'),
  ('stripe_secret_key', '"sk_test_51234567890abcdef"', 'payment', 'Stripe secret key for payments'),
  ('enable_online_payments', 'true', 'payment', 'Enable online payment processing')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description,
  updated_at = now();