// src/app/(dashboard)/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { withRole } from '@/lib/auth';
import { User } from '@/lib/types';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Define a more precise type for form data
type UserFormData = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role: 'student' | 'teacher' | 'admin';
};

function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  // User form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'student',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await usersApi.getUsers();
        setUsers(response.results);
        setFilteredUsers(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...users];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (roleFilter) {
      result = result.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'role' 
        ? value as 'student' | 'teacher' | 'admin' 
        : value 
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await authApi.register(formData);
      
      // Update success message and close modal
      setSuccess('User created successfully');
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        role: 'student',
      });
      
      // Refresh user list
      const response = await usersApi.getUsers();
      setUsers(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role badge colors
  const getRoleBadgeColor = (role: string): 'blue' | 'green' | 'red' => {
    switch (role) {
      case 'student':
        return 'blue';
      case 'teacher':
        return 'green';
      case 'admin':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">Users</h1>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="primary"
              className="inline-flex items-center"
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Create User
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" message={error} />
        )}
        
        {success && (
          <Alert variant="success" message={success} />
        )}
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  fullWidth
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'Všechny role' },
                  { value: 'student', label: 'Studenti' },
                  { value: 'teacher', label: 'Učitelé' },
                  { value: 'admin', label: 'Admini' },
                ]}
                fullWidth
              />
            </div>
          </div>
        </div>
        
        {/* Users list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 bg-white shadow rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Žádní uživatelé nenalezeni</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter 
                ? 'Zkuste upravit vyhledávání' 
                : 'Žádní uživatelé nevytvoření'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uživatelské jméno
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Připojil se
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outline" size="sm">
                          Zobrazit detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Create User Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vytvořit nového uživatele"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Uživatelské jméno"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={formErrors.username}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Input
                label="Heslo"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={formErrors.password}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Input
                label="Potvrzení hesla"
                id="password_confirm"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleInputChange}
                error={formErrors.password_confirm}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Select
                label="Role"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'teacher', label: 'Učitel' },
                  { value: 'admin', label: 'Admin' },
                ]}
                fullWidth
                required
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Vytvořit uživatele
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withRole(UsersManagementPage, ['admin']);