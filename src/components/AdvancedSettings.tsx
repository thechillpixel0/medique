import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle, 
  Database,
  Bell,
  Shield,
  Palette,
  Clock,
  Users,
  Mail,
  Smartphone,
  Globe,
  Server,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { ClinicSettings } from '../types';

interface AdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'notifications' | 'security' | 'appearance' | 'integrations' | 'backup'>('system');
  const [settings, setSettings] = useState<ClinicSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    clinic_name: 'MediQueue Clinic',
    clinic_address: '',
    clinic_phone: '',
    clinic_email: '',
    clinic_website: '',
    max_tokens_per_day: 100,
    max_tokens_per_department: 50,
    token_validity_hours: 24,
    auto_expire_tokens: true,
    allow_walk_ins: true,
    maintenance_mode: false,
    maintenance_message: 'System is under maintenance. Please try again later.',
    debug_mode: false,
    log_level: 'info'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    enable_sms: false,
    enable_email: false,
    enable_push: true,
    sms_provider: 'twilio',
    sms_api_key: '',
    sms_api_secret: '',
    email_provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    notification_templates: {
      booking_confirmation: 'Your token #{stn} has been booked for {department}.',
      queue_reminder: 'Your turn is approaching. Token #{stn} - {department}.',
      appointment_ready: 'Please proceed to {department}. Your token #{stn} is now being served.'
    }
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    enable_2fa: false,
    session_timeout: 30,
    max_login_attempts: 5,
    lockout_duration: 15,
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false
    },
    enable_audit_log: true,
    data_retention_days: 365,
    enable_encryption: true,
    api_rate_limit: 100
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    font_family: 'Inter',
    logo_url: '',
    favicon_url: '',
    custom_css: '',
    show_branding: true,
    language: 'en',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    time_format: '24h'
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    whatsapp_api_key: '',
    telegram_bot_token: '',
    webhook_url: '',
    api_keys: [] as Array<{id: string, name: string, key: string, permissions: string[]}>
  });

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState({
    auto_backup: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    backup_retention: 30,
    backup_location: 'local',
    cloud_provider: 'aws',
    aws_access_key: '',
    aws_secret_key: '',
    aws_bucket: '',
    backup_encryption: true,
    backup_compression: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchAllSettings();
    }
  }, [isOpen]);

  const fetchAllSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      const settingsMap = (data || []).reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as any);

      // Update state with fetched settings
      setSystemSettings(prev => ({ ...prev, ...settingsMap }));
      setNotificationSettings(prev => ({ ...prev, ...settingsMap }));
      setSecuritySettings(prev => ({ ...prev, ...settingsMap }));
      setAppearanceSettings(prev => ({ ...prev, ...settingsMap }));
      setIntegrationSettings(prev => ({ ...prev, ...settingsMap }));
      setBackupSettings(prev => ({ ...prev, ...settingsMap }));

      setSettings(data || []);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any, type: string = 'system') => {
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          setting_type: type,
          description: `${key.replace(/_/g, ' ')} setting`
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      return false;
    }
  };

  const saveAllSettings = async (settingsObj: any, type: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const promises = Object.entries(settingsObj).map(([key, value]) =>
        saveSetting(key, value, type)
      );

      const results = await Promise.all(promises);
      
      if (results.every(result => result)) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Some settings failed to save');
      }
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'mk_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `API Key ${integrationSettings.api_keys.length + 1}`,
      key: generateApiKey(),
      permissions: ['read']
    };
    
    setIntegrationSettings(prev => ({
      ...prev,
      api_keys: [...prev.api_keys, newKey]
    }));
  };

  const removeApiKey = (id: string) => {
    setIntegrationSettings(prev => ({
      ...prev,
      api_keys: prev.api_keys.filter(key => key.id !== id)
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testConnection = async (type: string) => {
    // Simulate connection test
    setSuccess(`${type} connection test successful!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportSettings = () => {
    const allSettings = {
      system: systemSettings,
      notifications: notificationSettings,
      security: securitySettings,
      appearance: appearanceSettings,
      integrations: integrationSettings,
      backup: backupSettings,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mediqueue-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings.system) setSystemSettings(settings.system);
        if (settings.notifications) setNotificationSettings(settings.notifications);
        if (settings.security) setSecuritySettings(settings.security);
        if (settings.appearance) setAppearanceSettings(settings.appearance);
        if (settings.integrations) setIntegrationSettings(settings.integrations);
        if (settings.backup) setBackupSettings(settings.backup);
        
        setSuccess('Settings imported successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Clinic Name"
              value={systemSettings.clinic_name}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, clinic_name: e.target.value }))}
            />
            <Input
              label="Phone Number"
              value={systemSettings.clinic_phone}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, clinic_phone: e.target.value }))}
            />
            <Input
              label="Email Address"
              type="email"
              value={systemSettings.clinic_email}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, clinic_email: e.target.value }))}
            />
            <Input
              label="Website URL"
              value={systemSettings.clinic_website}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, clinic_website: e.target.value }))}
            />
          </div>
          <Input
            label="Address"
            value={systemSettings.clinic_address}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, clinic_address: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Queue Management
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Max Tokens Per Day"
              type="number"
              value={systemSettings.max_tokens_per_day}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, max_tokens_per_day: parseInt(e.target.value) }))}
            />
            <Input
              label="Max Tokens Per Department"
              type="number"
              value={systemSettings.max_tokens_per_department}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, max_tokens_per_department: parseInt(e.target.value) }))}
            />
            <Input
              label="Token Validity (Hours)"
              type="number"
              value={systemSettings.token_validity_hours}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, token_validity_hours: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_expire"
                checked={systemSettings.auto_expire_tokens}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, auto_expire_tokens: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="auto_expire" className="text-sm font-medium text-gray-700">
                Auto-expire old tokens
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_walk_ins"
                checked={systemSettings.allow_walk_ins}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, allow_walk_ins: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="allow_walk_ins" className="text-sm font-medium text-gray-700">
                Allow walk-in patients
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Control
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={systemSettings.maintenance_mode}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="maintenance_mode" className="text-sm font-medium text-gray-700">
                Maintenance Mode
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="debug_mode"
                checked={systemSettings.debug_mode}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, debug_mode: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="debug_mode" className="text-sm font-medium text-gray-700">
                Debug Mode
              </label>
            </div>
          </div>
          
          <Input
            label="Maintenance Message"
            value={systemSettings.maintenance_message}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenance_message: e.target.value }))}
          />
          
          <Select
            label="Log Level"
            value={systemSettings.log_level}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, log_level: e.target.value }))}
            options={[
              { value: 'error', label: 'Error Only' },
              { value: 'warn', label: 'Warnings & Errors' },
              { value: 'info', label: 'Info, Warnings & Errors' },
              { value: 'debug', label: 'All Messages (Debug)' }
            ]}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(systemSettings, 'system')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save System Settings
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Channels
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_sms"
                checked={notificationSettings.enable_sms}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enable_sms: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable_sms" className="text-sm font-medium text-gray-700">
                SMS Notifications
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_email"
                checked={notificationSettings.enable_email}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enable_email: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable_email" className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_push"
                checked={notificationSettings.enable_push}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enable_push: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable_push" className="text-sm font-medium text-gray-700">
                Push Notifications
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {notificationSettings.enable_sms && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              SMS Configuration
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="SMS Provider"
              value={notificationSettings.sms_provider}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms_provider: e.target.value }))}
              options={[
                { value: 'twilio', label: 'Twilio' },
                { value: 'aws_sns', label: 'AWS SNS' },
                { value: 'textlocal', label: 'TextLocal' },
                { value: 'msg91', label: 'MSG91' }
              ]}
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="API Key"
                  type={showSecrets.sms_api_key ? 'text' : 'password'}
                  value={notificationSettings.sms_api_key}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms_api_key: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility('sms_api_key')}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.sms_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="API Secret"
                  type={showSecrets.sms_api_secret ? 'text' : 'password'}
                  value={notificationSettings.sms_api_secret}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms_api_secret: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility('sms_api_secret')}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.sms_api_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button onClick={() => testConnection('SMS')} variant="outline" size="sm">
              Test SMS Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {notificationSettings.enable_email && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Configuration
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Email Provider"
              value={notificationSettings.email_provider}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, email_provider: e.target.value }))}
              options={[
                { value: 'smtp', label: 'SMTP' },
                { value: 'sendgrid', label: 'SendGrid' },
                { value: 'mailgun', label: 'Mailgun' },
                { value: 'aws_ses', label: 'AWS SES' }
              ]}
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={notificationSettings.smtp_host}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
              />
              <Input
                label="SMTP Port"
                type="number"
                value={notificationSettings.smtp_port}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
              />
              <Input
                label="Username"
                value={notificationSettings.smtp_username}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showSecrets.smtp_password ? 'text' : 'password'}
                  value={notificationSettings.smtp_password}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility('smtp_password')}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.smtp_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button onClick={() => testConnection('Email')} variant="outline" size="sm">
              Test Email Connection
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Notification Templates</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Confirmation
            </label>
            <textarea
              value={notificationSettings.notification_templates.booking_confirmation}
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                notification_templates: {
                  ...prev.notification_templates,
                  booking_confirmation: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Queue Reminder
            </label>
            <textarea
              value={notificationSettings.notification_templates.queue_reminder}
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                notification_templates: {
                  ...prev.notification_templates,
                  queue_reminder: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Ready
            </label>
            <textarea
              value={notificationSettings.notification_templates.appointment_ready}
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                notification_templates: {
                  ...prev.notification_templates,
                  appointment_ready: e.target.value
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-1">Available Variables:</h4>
            <p className="text-sm text-blue-800">
              {'{stn}'} - Token number, {'{department}'} - Department name, {'{patient_name}'} - Patient name, 
              {'{clinic_name}'} - Clinic name, {'{date}'} - Date, {'{time}'} - Time
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(notificationSettings, 'notification')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication & Access
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_2fa"
                checked={securitySettings.enable_2fa}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, enable_2fa: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable_2fa" className="text-sm font-medium text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_audit_log"
                checked={securitySettings.enable_audit_log}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, enable_audit_log: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable_audit_log" className="text-sm font-medium text-gray-700">
                Enable Audit Logging
              </label>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={securitySettings.session_timeout}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
            />
            <Input
              label="Max Login Attempts"
              type="number"
              value={securitySettings.max_login_attempts}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
            />
            <Input
              label="Lockout Duration (minutes)"
              type="number"
              value={securitySettings.lockout_duration}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockout_duration: parseInt(e.target.value) }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Password Policy</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Minimum Length"
            type="number"
            value={securitySettings.password_policy.min_length}
            onChange={(e) => setSecuritySettings(prev => ({
              ...prev,
              password_policy: {
                ...prev.password_policy,
                min_length: parseInt(e.target.value)
              }
            }))}
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_uppercase"
                checked={securitySettings.password_policy.require_uppercase}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  password_policy: {
                    ...prev.password_policy,
                    require_uppercase: e.target.checked
                  }
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_uppercase" className="text-sm font-medium text-gray-700">
                Require Uppercase Letters
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_lowercase"
                checked={securitySettings.password_policy.require_lowercase}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  password_policy: {
                    ...prev.password_policy,
                    require_lowercase: e.target.checked
                  }
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_lowercase" className="text-sm font-medium text-gray-700">
                Require Lowercase Letters
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_numbers"
                checked={securitySettings.password_policy.require_numbers}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  password_policy: {
                    ...prev.password_policy,
                    require_numbers: e.target.checked
                  }
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_numbers" className="text-sm font-medium text-gray-700">
                Require Numbers
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_symbols"
                checked={securitySettings.password_policy.require_symbols}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  password_policy: {
                    ...prev.password_policy,
                    require_symbols: e.target.checked
                  }
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_symbols" className="text-sm font-medium text-gray-700">
                Require Special Characters
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Data Protection</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Data Retention (days)"
              type="number"
              value={securitySettings.data_retention_days}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) }))}
            />
            <Input
              label="API Rate Limit (requests/minute)"
              type="number"
              value={securitySettings.api_rate_limit}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, api_rate_limit: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enable_encryption"
              checked={securitySettings.enable_encryption}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, enable_encryption: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="enable_encryption" className="text-sm font-medium text-gray-700">
              Enable Data Encryption at Rest
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(securitySettings, 'security')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Security Settings
        </Button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Theme & Colors
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Theme"
            value={appearanceSettings.theme}
            onChange={(e) => setAppearanceSettings(prev => ({ ...prev, theme: e.target.value }))}
            options={[
              { value: 'light', label: 'Light Theme' },
              { value: 'dark', label: 'Dark Theme' },
              { value: 'auto', label: 'Auto (System)' }
            ]}
          />
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={appearanceSettings.primary_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded"
                />
                <Input
                  value={appearanceSettings.primary_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={appearanceSettings.secondary_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded"
                />
                <Input
                  value={appearanceSettings.secondary_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={appearanceSettings.accent_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded"
                />
                <Input
                  value={appearanceSettings.accent_color}
                  onChange={(e) => setAppearanceSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Branding</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Logo URL"
              value={appearanceSettings.logo_url}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
            <Input
              label="Favicon URL"
              value={appearanceSettings.favicon_url}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
              placeholder="https://example.com/favicon.ico"
            />
          </div>
          
          <Select
            label="Font Family"
            value={appearanceSettings.font_family}
            onChange={(e) => setAppearanceSettings(prev => ({ ...prev, font_family: e.target.value }))}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Roboto', label: 'Roboto' },
              { value: 'Open Sans', label: 'Open Sans' },
              { value: 'Lato', label: 'Lato' },
              { value: 'Poppins', label: 'Poppins' }
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show_branding"
              checked={appearanceSettings.show_branding}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, show_branding: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="show_branding" className="text-sm font-medium text-gray-700">
              Show "Powered by MediQueue" branding
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Localization
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Default Language"
              value={appearanceSettings.language}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, language: e.target.value }))}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi (हिंदी)' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' }
              ]}
            />
            <Select
              label="Timezone"
              value={appearanceSettings.timezone}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, timezone: e.target.value }))}
              options={[
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                { value: 'America/New_York', label: 'America/New_York (EST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT)' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' }
              ]}
            />
            <Select
              label="Date Format"
              value={appearanceSettings.date_format}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, date_format: e.target.value }))}
              options={[
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
              ]}
            />
            <Select
              label="Time Format"
              value={appearanceSettings.time_format}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, time_format: e.target.value }))}
              options={[
                { value: '24h', label: '24 Hour (14:30)' },
                { value: '12h', label: '12 Hour (2:30 PM)' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Custom CSS</h3>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom CSS Code
            </label>
            <textarea
              value={appearanceSettings.custom_css}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, custom_css: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              rows={8}
              placeholder="/* Add your custom CSS here */
.custom-header {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(appearanceSettings, 'appearance')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Appearance Settings
        </Button>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Payment Gateways</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="stripe_enabled"
                  checked={integrationSettings.stripe_enabled}
                  onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripe_enabled: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="stripe_enabled" className="font-medium text-gray-900">
                  Stripe Payment Gateway
                </label>
              </div>
              <div className="text-sm text-gray-500">Global payments</div>
            </div>
            
            {integrationSettings.stripe_enabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Publishable Key"
                    type={showSecrets.stripe_publishable_key ? 'text' : 'password'}
                    value={integrationSettings.stripe_publishable_key}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('stripe_publishable_key')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.stripe_publishable_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Secret Key"
                    type={showSecrets.stripe_secret_key ? 'text' : 'password'}
                    value={integrationSettings.stripe_secret_key}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                    placeholder="sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('stripe_secret_key')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.stripe_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="razorpay_enabled"
                  checked={integrationSettings.razorpay_enabled}
                  onChange={(e) => setIntegrationSettings(prev => ({ ...prev, razorpay_enabled: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="razorpay_enabled" className="font-medium text-gray-900">
                  Razorpay Payment Gateway
                </label>
              </div>
              <div className="text-sm text-gray-500">India payments</div>
            </div>
            
            {integrationSettings.razorpay_enabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Key ID"
                    type={showSecrets.razorpay_key_id ? 'text' : 'password'}
                    value={integrationSettings.razorpay_key_id}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                    placeholder="rzp_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('razorpay_key_id')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.razorpay_key_id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Key Secret"
                    type={showSecrets.razorpay_key_secret ? 'text' : 'password'}
                    value={integrationSettings.razorpay_key_secret}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, razorpay_key_secret: e.target.value }))}
                    placeholder="Secret key..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('razorpay_key_secret')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.razorpay_key_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Analytics & Tracking</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Google Analytics ID"
              value={integrationSettings.google_analytics_id}
              onChange={(e) => setIntegrationSettings(prev => ({ ...prev, google_analytics_id: e.target.value }))}
              placeholder="GA-XXXXXXXXX-X"
            />
            <Input
              label="Facebook Pixel ID"
              value={integrationSettings.facebook_pixel_id}
              onChange={(e) => setIntegrationSettings(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
              placeholder="123456789012345"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Communication APIs</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="WhatsApp API Key"
                type={showSecrets.whatsapp_api_key ? 'text' : 'password'}
                value={integrationSettings.whatsapp_api_key}
                onChange={(e) => setIntegrationSettings(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                placeholder="WhatsApp Business API key"
              />
              <button
                type="button"
                onClick={() => toggleSecretVisibility('whatsapp_api_key')}
                className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
              >
                {showSecrets.whatsapp_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="relative">
              <Input
                label="Telegram Bot Token"
                type={showSecrets.telegram_bot_token ? 'text' : 'password'}
                value={integrationSettings.telegram_bot_token}
                onChange={(e) => setIntegrationSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                placeholder="Bot token from BotFather"
              />
              <button
                type="button"
                onClick={() => toggleSecretVisibility('telegram_bot_token')}
                className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
              >
                {showSecrets.telegram_bot_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Input
            label="Webhook URL"
            value={integrationSettings.webhook_url}
            onChange={(e) => setIntegrationSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
            placeholder="https://your-app.com/webhook"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Key className="h-5 w-5 mr-2" />
              API Keys
            </h3>
            <Button onClick={addApiKey} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationSettings.api_keys.map((apiKey) => (
              <div key={apiKey.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Input
                    value={apiKey.name}
                    onChange={(e) => setIntegrationSettings(prev => ({
                      ...prev,
                      api_keys: prev.api_keys.map(key => 
                        key.id === apiKey.id ? { ...key, name: e.target.value } : key
                      )
                    }))}
                    className="flex-1 mr-4"
                  />
                  <Button onClick={() => removeApiKey(apiKey.id)} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative mb-2">
                  <Input
                    value={apiKey.key}
                    readOnly
                    type={showSecrets[`api_key_${apiKey.id}`] ? 'text' : 'password'}
                    className="font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility(`api_key_${apiKey.id}`)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets[`api_key_${apiKey.id}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['read', 'write', 'admin'].map((permission) => (
                    <label key={permission} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={apiKey.permissions.includes(permission)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...apiKey.permissions, permission]
                            : apiKey.permissions.filter(p => p !== permission);
                          
                          setIntegrationSettings(prev => ({
                            ...prev,
                            api_keys: prev.api_keys.map(key => 
                              key.id === apiKey.id ? { ...key, permissions: newPermissions } : key
                            )
                          }));
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            {integrationSettings.api_keys.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No API keys generated yet.</p>
                <p className="text-sm">Click "Generate API Key" to create your first key.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(integrationSettings, 'integration')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Integration Settings
        </Button>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Automatic Backup
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_backup"
              checked={backupSettings.auto_backup}
              onChange={(e) => setBackupSettings(prev => ({ ...prev, auto_backup: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="auto_backup" className="text-sm font-medium text-gray-700">
              Enable Automatic Backup
            </label>
          </div>
          
          {backupSettings.auto_backup && (
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="Backup Frequency"
                value={backupSettings.backup_frequency}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_frequency: e.target.value }))}
                options={[
                  { value: 'hourly', label: 'Every Hour' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
              />
              
              <Input
                label="Backup Time"
                type="time"
                value={backupSettings.backup_time}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_time: e.target.value }))}
              />
              
              <Input
                label="Retention Period (days)"
                type="number"
                value={backupSettings.backup_retention}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_retention: parseInt(e.target.value) }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Backup Location</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Storage Location"
            value={backupSettings.backup_location}
            onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_location: e.target.value }))}
            options={[
              { value: 'local', label: 'Local Server' },
              { value: 'cloud', label: 'Cloud Storage' },
              { value: 'both', label: 'Local + Cloud' }
            ]}
          />
          
          {(backupSettings.backup_location === 'cloud' || backupSettings.backup_location === 'both') && (
            <>
              <Select
                label="Cloud Provider"
                value={backupSettings.cloud_provider}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, cloud_provider: e.target.value }))}
                options={[
                  { value: 'aws', label: 'Amazon S3' },
                  { value: 'gcp', label: 'Google Cloud Storage' },
                  { value: 'azure', label: 'Azure Blob Storage' },
                  { value: 'dropbox', label: 'Dropbox' }
                ]}
              />
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Access Key"
                    type={showSecrets.aws_access_key ? 'text' : 'password'}
                    value={backupSettings.aws_access_key}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, aws_access_key: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('aws_access_key')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.aws_access_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Secret Key"
                    type={showSecrets.aws_secret_key ? 'text' : 'password'}
                    value={backupSettings.aws_secret_key}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, aws_secret_key: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('aws_secret_key')}
                    className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets.aws_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Input
                label="Bucket Name"
                value={backupSettings.aws_bucket}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, aws_bucket: e.target.value }))}
                placeholder="my-clinic-backups"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Backup Options</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="backup_encryption"
                checked={backupSettings.backup_encryption}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_encryption: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="backup_encryption" className="text-sm font-medium text-gray-700">
                Encrypt Backups
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="backup_compression"
                checked={backupSettings.backup_compression}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_compression: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="backup_compression" className="text-sm font-medium text-gray-700">
                Compress Backups
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Manual Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => alert('Backup started!')} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Create Backup Now
            </Button>
            <Button onClick={() => alert('Restore initiated!')} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Restore from Backup
            </Button>
            <Button onClick={() => testConnection('Backup Storage')} variant="outline">
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveAllSettings(backupSettings, 'backup')} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Backup Settings
        </Button>
      </div>
    </div>
  );

  const tabs = [
    { key: 'system', label: 'System', icon: Settings },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'integrations', label: 'Integrations', icon: Globe },
    { key: 'backup', label: 'Backup', icon: Database }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Settings" size="xl">
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Import/Export Controls */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />
            <Button
              onClick={() => document.getElementById('import-settings')?.click()}
              variant="outline"
              size="sm"
            >
              Import Settings
            </Button>
            <Button onClick={exportSettings} variant="outline" size="sm">
              Export Settings
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading settings...</p>
            </div>
          ) : (
            <>
              {activeTab === 'system' && renderSystemSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'integrations' && renderIntegrationSettings()}
              {activeTab === 'backup' && renderBackupSettings()}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};