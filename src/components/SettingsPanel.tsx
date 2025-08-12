import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { ClinicSettings, Department, Doctor } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'doctors' | 'payment'>('general');
  const [settings, setSettings] = useState<ClinicSettings[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('clinic_settings')
        .select('*')
        .order('setting_key');

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('display_name');

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (settingsError) {
        console.error('Settings error:', settingsError);
      }
      if (departmentsError) {
        console.error('Departments error:', departmentsError);
      }
      if (doctorsError) {
        console.error('Doctors error:', doctorsError);
      }

      setSettings(settingsData || []);
      setDepartments(departmentsData || []);
      setDoctors(doctorsData || []);

      // Initialize default settings if none exist
      if (!settingsData || settingsData.length === 0) {
        await initializeDefaultSettings();
      }

      // Initialize default departments if none exist
      if (!departmentsData || departmentsData.length === 0) {
        await initializeDefaultDepartments();
      }

    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    const defaultSettings = [
      {
        setting_key: 'clinic_name',
        setting_value: 'MediQueue Clinic',
        setting_type: 'general',
        description: 'Name of the clinic'
      },
      {
        setting_key: 'maintenance_mode',
        setting_value: false,
        setting_type: 'general',
        description: 'Enable maintenance mode to prevent new bookings'
      },
      {
        setting_key: 'maintenance_message',
        setting_value: 'System is under maintenance. Please try again later.',
        setting_type: 'general',
        description: 'Message to show when maintenance mode is enabled'
      },
      {
        setting_key: 'average_consultation_time',
        setting_value: 15,
        setting_type: 'general',
        description: 'Average consultation time in minutes'
      },
      {
        setting_key: 'max_tokens_per_day',
        setting_value: 100,
        setting_type: 'general',
        description: 'Maximum tokens per day per department'
      },
      {
        setting_key: 'clinic_hours_start',
        setting_value: '09:00',
        setting_type: 'general',
        description: 'Clinic opening time'
      },
      {
        setting_key: 'clinic_hours_end',
        setting_value: '18:00',
        setting_type: 'general',
        description: 'Clinic closing time'
      },
      {
        setting_key: 'auto_refresh_interval',
        setting_value: 30,
        setting_type: 'general',
        description: 'Auto refresh interval in seconds for admin dashboard'
      },
      {
        setting_key: 'stripe_publishable_key',
        setting_value: 'pk_test_51234567890abcdef',
        setting_type: 'payment',
        description: 'Stripe publishable key for payments'
      },
      {
        setting_key: 'stripe_secret_key',
        setting_value: 'sk_test_51234567890abcdef',
        setting_type: 'payment',
        description: 'Stripe secret key for payments'
      },
      {
        setting_key: 'enable_online_payments',
        setting_value: true,
        setting_type: 'payment',
        description: 'Enable online payment processing'
      }
    ];

    try {
      const { error } = await supabase
        .from('clinic_settings')
        .insert(defaultSettings);
      
      if (error) throw error;
      
      // Refresh settings
      const { data: newSettings } = await supabase
        .from('clinic_settings')
        .select('*')
        .order('setting_key');
      
      setSettings(newSettings || []);
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  };

  const initializeDefaultDepartments = async () => {
    const defaultDepartments = [
      {
        name: 'general',
        display_name: 'General Medicine',
        description: 'General medical consultation and treatment',
        consultation_fee: 500,
        average_consultation_time: 15,
        color_code: '#3B82F6',
        is_active: true
      },
      {
        name: 'cardiology',
        display_name: 'Cardiology',
        description: 'Heart and cardiovascular system treatment',
        consultation_fee: 800,
        average_consultation_time: 20,
        color_code: '#EF4444',
        is_active: true
      },
      {
        name: 'orthopedics',
        display_name: 'Orthopedics',
        description: 'Bone, joint, and muscle treatment',
        consultation_fee: 700,
        average_consultation_time: 18,
        color_code: '#10B981',
        is_active: true
      },
      {
        name: 'pediatrics',
        display_name: 'Pediatrics',
        description: 'Child healthcare and treatment',
        consultation_fee: 600,
        average_consultation_time: 20,
        color_code: '#F59E0B',
        is_active: true
      }
    ];

    try {
      const { error } = await supabase
        .from('departments')
        .insert(defaultDepartments);
      
      if (error) throw error;
      
      // Refresh departments
      const { data: newDepartments } = await supabase
        .from('departments')
        .select('*')
        .order('display_name');
      
      setDepartments(newDepartments || []);
    } catch (error) {
      console.error('Error initializing departments:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: value,
          setting_type: 'general',
          description: settings.find(s => s.setting_key === key)?.description || ''
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
      
      // Update local state
      setSettings(prev => prev.map(s => 
        s.setting_key === key 
          ? { ...s, setting_value: value }
          : s
      ));
      
      // Show success message
      setTimeout(() => {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Setting updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      }, 100);
      
    } catch (error: any) {
      console.error('Error updating setting:', error);
      setError(error.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const saveDepartment = async (department: Partial<Department>) => {
    setSaving(true);
    setError('');
    try {
      if (!department.name || !department.display_name) {
        throw new Error('Name and display name are required');
      }

      const departmentData = {
        ...department,
        name: department.name.toLowerCase().replace(/\s+/g, '_'),
        consultation_fee: Number(department.consultation_fee) || 0,
        average_consultation_time: Number(department.average_consultation_time) || 15,
        color_code: department.color_code || '#3B82F6',
        is_active: department.is_active !== false
      };

      if (department.id) {
        const { error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', department.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('departments')
          .insert(departmentData);
        if (error) throw error;
      }
      
      await fetchData();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error saving department:', error);
      setError(error.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const saveDoctor = async (doctor: Partial<Doctor>) => {
    setSaving(true);
    setError('');
    try {
      if (!doctor.name || !doctor.specialization) {
        throw new Error('Name and specialization are required');
      }

      const doctorData = {
        ...doctor,
        experience_years: Number(doctor.experience_years) || 0,
        consultation_fee: Number(doctor.consultation_fee) || 0,
        max_patients_per_day: Number(doctor.max_patients_per_day) || 50,
        available_days: doctor.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours: doctor.available_hours || { start: '09:00', end: '17:00' },
        status: doctor.status || 'active'
      };

      if (doctor.id) {
        const { error } = await supabase
          .from('doctors')
          .update(doctorData)
          .eq('id', doctor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert(doctorData);
        if (error) throw error;
      }
      
      await fetchData();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      setError(error.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setSaving(true);
    setError('');
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      setError(error.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {settings.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : (
        settings.map((setting) => (
          <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-sm text-gray-600">{setting.description}</p>
            </div>
            <div className="w-64 ml-4">
              {setting.setting_key === 'maintenance_mode' || setting.setting_key === 'enable_online_payments' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={setting.setting_value}
                    onChange={(e) => updateSetting(setting.setting_key, e.target.checked)}
                    disabled={saving}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {setting.setting_value ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : setting.setting_key.includes('time') ? (
                <Input
                  type="time"
                  value={setting.setting_value}
                  onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                  disabled={saving}
                />
              ) : setting.setting_key.includes('max_') || setting.setting_key.includes('average_') || setting.setting_key.includes('interval') ? (
                <Input
                  type="number"
                  value={setting.setting_value}
                  onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                  disabled={saving}
                  min="0"
                />
              ) : setting.setting_key === 'maintenance_message' ? (
                <textarea
                  value={setting.setting_value}
                  onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              ) : (
                <Input
                  value={setting.setting_value}
                  onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                  disabled={saving}
                />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Departments ({departments.length})</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              display_name: '',
              description: '',
              consultation_fee: 500,
              average_consultation_time: 15,
              color_code: '#3B82F6',
              is_active: true
            });
            setShowEditModal(true);
          }}
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: dept.color_code }}
                  ></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{dept.display_name}</h4>
                    <p className="text-sm text-gray-600">{dept.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>Fee: ₹{dept.consultation_fee}</span>
                      <span>Time: {dept.average_consultation_time}min</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(dept);
                      setShowEditModal(true);
                    }}
                    disabled={saving}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteItem('departments', dept.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {departments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No departments found. Default departments will be created automatically.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Doctors ({doctors.length})</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              specialization: '',
              qualification: '',
              experience_years: 0,
              consultation_fee: 500,
              available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              available_hours: { start: '09:00', end: '17:00' },
              max_patients_per_day: 50,
              status: 'active'
            });
            setShowEditModal(true);
          }}
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                      doctor.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doctor.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {doctor.specialization} • {doctor.qualification || 'No qualification listed'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{doctor.experience_years} years exp</span>
                    <span>₹{doctor.consultation_fee}</span>
                    <span>Max: {doctor.max_patients_per_day}/day</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {doctor.available_hours.start} - {doctor.available_hours.end} • {doctor.available_days.length} days/week
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(doctor);
                      setShowEditModal(true);
                    }}
                    disabled={saving}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteItem('doctors', doctor.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {doctors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No doctors found. Add your first doctor to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEditModal = () => {
    if (!editingItem) return null;

    const isDepartment = 'display_name' in editingItem;
    const isDoctor = 'specialization' in editingItem;

    return (
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setError('');
        }}
        title={`${editingItem.id ? 'Edit' : 'Add'} ${isDepartment ? 'Department' : 'Doctor'}`}
        size="lg"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          {isDepartment && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Name (Internal)"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  placeholder="e.g., general_medicine"
                  required
                />
                <Input
                  label="Display Name"
                  value={editingItem.display_name}
                  onChange={(e) => setEditingItem({...editingItem, display_name: e.target.value})}
                  placeholder="e.g., General Medicine"
                  required
                />
              </div>
              <Input
                label="Description"
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                placeholder="Brief description of the department"
              />
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee (₹)"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value) || 0})}
                  min="0"
                  required
                />
                <Input
                  label="Avg Time (minutes)"
                  type="number"
                  value={editingItem.average_consultation_time}
                  onChange={(e) => setEditingItem({...editingItem, average_consultation_time: parseInt(e.target.value) || 15})}
                  min="1"
                  required
                />
                <Input
                  label="Color Code"
                  type="color"
                  value={editingItem.color_code}
                  onChange={(e) => setEditingItem({...editingItem, color_code: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingItem.is_active}
                  onChange={(e) => setEditingItem({...editingItem, is_active: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active Department
                </label>
              </div>
            </>
          )}

          {isDoctor && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  placeholder="Dr. John Doe"
                  required
                />
                <Select
                  label="Specialization"
                  value={editingItem.specialization}
                  onChange={(e) => setEditingItem({...editingItem, specialization: e.target.value})}
                  options={[
                    { value: '', label: 'Select Specialization' },
                    ...departments.map(dept => ({ value: dept.name, label: dept.display_name }))
                  ]}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Qualification"
                  value={editingItem.qualification || ''}
                  onChange={(e) => setEditingItem({...editingItem, qualification: e.target.value})}
                  placeholder="MBBS, MD"
                />
                <Input
                  label="Experience (years)"
                  type="number"
                  value={editingItem.experience_years}
                  onChange={(e) => setEditingItem({...editingItem, experience_years: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee (₹)"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value) || 0})}
                  min="0"
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={editingItem.available_hours?.start || '09:00'}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...(editingItem.available_hours || {}), start: e.target.value}
                  })}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={editingItem.available_hours?.end || '17:00'}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...(editingItem.available_hours || {}), end: e.target.value}
                  })}
                />
              </div>
              <Input
                label="Max Patients Per Day"
                type="number"
                value={editingItem.max_patients_per_day}
                onChange={(e) => setEditingItem({...editingItem, max_patients_per_day: parseInt(e.target.value) || 50})}
                min="1"
              />
              <Select
                label="Status"
                value={editingItem.status}
                onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'on_leave', label: 'On Leave' }
                ]}
                required
              />
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setError('');
              }}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isDepartment) {
                  saveDepartment(editingItem);
                } else if (isDoctor) {
                  saveDoctor(editingItem);
                }
              }}
              className="flex-1"
              loading={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Clinic Settings" size="xl">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'general', label: 'General Settings', icon: Settings },
                { key: 'departments', label: `Departments (${departments.length})`, icon: Settings },
                { key: 'doctors', label: `Doctors (${doctors.length})`, icon: Settings },
                { key: 'payment', label: 'Payment Settings', icon: Settings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
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
                {activeTab === 'general' && renderGeneralSettings()}
                {activeTab === 'departments' && renderDepartments()}
                {activeTab === 'doctors' && renderDoctors()}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-700">{error}</span>
                      </div>
                    )}
                    
                    {settings.filter(s => s.setting_type === 'payment').map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                        <div className="w-64 ml-4">
                          {setting.setting_key === 'enable_online_payments' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={setting.setting_value}
                                onChange={(e) => updateSetting(setting.setting_key, e.target.checked)}
                                disabled={saving}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {setting.setting_value ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          ) : (
                            <Input
                              type={setting.setting_key.includes('secret') ? 'password' : 'text'}
                              value={setting.setting_value}
                              onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                              disabled={saving}
                              placeholder={setting.setting_key.includes('key') ? 'Enter your Stripe key' : ''}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Stripe Test Mode</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        The system is configured with Stripe test keys. Use test card numbers for payments:
                      </p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• Success: 4242 4242 4242 4242</p>
                        <p>• Decline: 4000 0000 0000 0002</p>
                        <p>• Any future expiry date and CVC</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {renderEditModal()}
    </>
  );
};