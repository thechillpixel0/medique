import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Edit } from 'lucide-react';
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
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, departmentsRes, doctorsRes] = await Promise.all([
        supabase.from('clinic_settings').select('*').order('setting_key'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('doctors').select('*').order('name')
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (departmentsRes.data) setDepartments(departmentsRes.data);
      if (doctorsRes.data) setDoctors(doctorsRes.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: JSON.stringify(value),
          setting_type: 'general'
        });

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    }
  };

  const saveDepartment = async (department: Partial<Department>) => {
    try {
      if (department.id) {
        const { error } = await supabase
          .from('departments')
          .update(department)
          .eq('id', department.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('departments')
          .insert(department);
        if (error) throw error;
      }
      fetchData();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  };

  const saveDoctor = async (doctor: Partial<Doctor>) => {
    try {
      if (doctor.id) {
        const { error } = await supabase
          .from('doctors')
          .update(doctor)
          .eq('id', doctor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert(doctor);
        if (error) throw error;
      }
      fetchData();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor');
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {settings.filter(s => s.setting_type === 'general').map((setting) => (
        <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">{setting.setting_key.replace('_', ' ').toUpperCase()}</h4>
            <p className="text-sm text-gray-600">{setting.description}</p>
          </div>
          <div className="w-64">
            <Input
              value={JSON.parse(setting.setting_value)}
              onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
              onBlur={(e) => updateSetting(setting.setting_key, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Departments</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              display_name: '',
              description: '',
              consultation_fee: 0,
              average_consultation_time: 15,
              color_code: '#3B82F6',
              is_active: true
            });
            setShowEditModal(true);
          }}
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
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dept.color_code }}
                  ></div>
                  <div>
                    <h4 className="font-medium">{dept.display_name}</h4>
                    <p className="text-sm text-gray-600">{dept.description}</p>
                    <p className="text-sm text-gray-500">
                      Fee: ₹{dept.consultation_fee} | Time: {dept.average_consultation_time}min
                    </p>
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
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteItem('departments', dept.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Doctors</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              specialization: '',
              qualification: '',
              experience_years: 0,
              consultation_fee: 0,
              available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              available_hours: { start: '09:00', end: '17:00' },
              max_patients_per_day: 50,
              status: 'active'
            });
            setShowEditModal(true);
          }}
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
                <div>
                  <h4 className="font-medium">{doctor.name}</h4>
                  <p className="text-sm text-gray-600">{doctor.specialization} | {doctor.qualification}</p>
                  <p className="text-sm text-gray-500">
                    {doctor.experience_years} years exp | ₹{doctor.consultation_fee} | Max: {doctor.max_patients_per_day}/day
                  </p>
                  <p className="text-sm text-gray-500">
                    {doctor.available_hours.start} - {doctor.available_hours.end}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                    doctor.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doctor.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(doctor);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteItem('doctors', doctor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
        }}
        title={`${editingItem.id ? 'Edit' : 'Add'} ${isDepartment ? 'Department' : 'Doctor'}`}
        size="lg"
      >
        <div className="space-y-4">
          {isDepartment && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
                <Input
                  label="Display Name"
                  value={editingItem.display_name}
                  onChange={(e) => setEditingItem({...editingItem, display_name: e.target.value})}
                />
              </div>
              <Input
                label="Description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
              />
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value)})}
                />
                <Input
                  label="Avg Time (minutes)"
                  type="number"
                  value={editingItem.average_consultation_time}
                  onChange={(e) => setEditingItem({...editingItem, average_consultation_time: parseInt(e.target.value)})}
                />
                <Input
                  label="Color Code"
                  type="color"
                  value={editingItem.color_code}
                  onChange={(e) => setEditingItem({...editingItem, color_code: e.target.value})}
                />
              </div>
            </>
          )}

          {isDoctor && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
                <Input
                  label="Specialization"
                  value={editingItem.specialization}
                  onChange={(e) => setEditingItem({...editingItem, specialization: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Qualification"
                  value={editingItem.qualification}
                  onChange={(e) => setEditingItem({...editingItem, qualification: e.target.value})}
                />
                <Input
                  label="Experience (years)"
                  type="number"
                  value={editingItem.experience_years}
                  onChange={(e) => setEditingItem({...editingItem, experience_years: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value)})}
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={editingItem.available_hours.start}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...editingItem.available_hours, start: e.target.value}
                  })}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={editingItem.available_hours.end}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...editingItem.available_hours, end: e.target.value}
                  })}
                />
              </div>
              <Input
                label="Max Patients Per Day"
                type="number"
                value={editingItem.max_patients_per_day}
                onChange={(e) => setEditingItem({...editingItem, max_patients_per_day: parseInt(e.target.value)})}
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
              />
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
              }}
              className="flex-1"
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
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Clinic Settings" size="xl">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'general', label: 'General', icon: Settings },
                { key: 'departments', label: 'Departments', icon: Settings },
                { key: 'doctors', label: 'Doctors', icon: Settings },
                { key: 'payment', label: 'Payment', icon: Settings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
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
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'general' && renderGeneralSettings()}
                {activeTab === 'departments' && renderDepartments()}
                {activeTab === 'doctors' && renderDoctors()}
                {activeTab === 'payment' && (
                  <div className="text-center py-8 text-gray-500">
                    Payment settings coming soon...
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