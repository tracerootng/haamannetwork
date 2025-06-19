import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Edit2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="py-6 animate-fade-in">
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <Button
            variant="ghost"
            icon={isEditing ? <LogOut size={16} /> : <Edit2 size={16} />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                leftIcon={<User size={16} />}
                required
              />
              
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail size={16} />}
                required
              />
              
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone size={16} />}
                required
              />
            </div>
            
            <Button
              type="submit"
              variant="primary"
              className="mt-6"
              fullWidth
            >
              Save Changes
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center py-2">
              <User size={20} className="text-gray-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center py-2">
              <Mail size={20} className="text-gray-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center py-2">
              <Phone size={20} className="text-gray-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start text-error-500"
            icon={<LogOut size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;