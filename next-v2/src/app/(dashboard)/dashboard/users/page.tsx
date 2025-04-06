// src/app/(dashboard)/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { withRole, useAuth } from '@/lib/auth';
import { User } from '@/lib/types';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon, TrashIcon, PencilIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

// Define a more precise type for form data
type UserFormData = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role: 'student' | 'teacher' | 'admin';
};

// Define a type for edit form data (without passwords)
type UserEditData = {
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
};

function UsersManagementPage() {
  // Get current logged in user
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  // User creation form
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

  // User edit form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<UserEditData>({
    username: '',
    email: '',
    role: 'student',
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: name === 'role' 
        ? value as 'student' | 'teacher' | 'admin' 
        : value 
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username) {
      errors.username = 'Uživatelské jméno je povinné';
    }
    
    if (!formData.email) {
      errors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email není validní';
    }
    
    if (!formData.password) {
      errors.password = 'Heslo je povinné';
    } else if (formData.password.length < 8) {
      errors.password = 'Heslo musí mít alespoň 8 znaků';
    }
    
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Hesla se neshodují';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.username) {
      errors.username = 'Uživatelské jméno je povinné';
    }
    
    if (!editFormData.email) {
      errors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      errors.email = 'Email není validní';
    }
    
    setEditFormErrors(errors);
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
      setSuccess('Uživatel byl úspěšně vytvořen');
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
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se vytvořit uživatele');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to open edit modal and populate form data
  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  // Function to handle user edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userToEdit || !validateEditForm()) {
      return;
    }
    
    setIsEditing(true);
    setError(null);
    
    try {
      // Add updateUser to your API functions
      await usersApi.updateUser(userToEdit.id, editFormData);
      
      // Update success message and close modal
      setSuccess(`Uživatel ${userToEdit.username} byl úspěšně upraven`);
      setIsEditModalOpen(false);
      setUserToEdit(null);
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se upravit uživatele');
    } finally {
      setIsEditing(false);
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await usersApi.deleteUser(userToDelete.id);
      
      // Update success message and close modal
      setSuccess(`Uživatel ${userToDelete.username} byl úspěšně smazán`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se smazat uživatele');
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to open delete confirmation modal
  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  // Check if user is the current logged in user
  const isCurrentUser = (userId: number) => {
    return currentUser?.id === userId;
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

  // Clear any success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">Uživatelé</h1>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="primary"
              className="inline-flex items-center"
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Vytvořit uživatele
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" message={error} onClose={() => setError(null)} />
        )}
        
        {success && (
          <Alert variant="success" message={success} onClose={() => setSuccess(null)} />
        )}
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Hledat podle jména nebo emailu..."
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
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-6 bg-white shadow rounded-lg">
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
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
              {/* Responsive Table */}
              <div className="block md:hidden">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            {isCurrentUser(user.id) && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Já
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeColor(user.role)} className="text-xs px-2 py-0.5">
                        {user.role === 'student' ? 'Student' : user.role === 'teacher' ? 'Učitel' : 'Admin'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="inline-flex items-center py-0.5"
                        onClick={() => openEditModal(user)}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Upravit
                      </Button>
                      <Button 
                        variant="danger" 
                        className="inline-flex items-center py-0.5"
                        onClick={() => confirmDelete(user)}
                        disabled={isCurrentUser(user.id)}
                        title={isCurrentUser(user.id) ? "Nelze smazat vlastní účet" : ""}
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Smazat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table */}
              <table className="hidden md:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uživatel
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrace
                    </th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              {isCurrentUser(user.id) && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Aktuální
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role === 'student' ? 'Student' : user.role === 'teacher' ? 'Učitel' : 'Admin'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            className="inline-flex items-center"
                            onClick={() => openEditModal(user)}
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Upravit
                          </Button>
                          <Button 
                            variant="danger" 
                            className="inline-flex items-center"
                            onClick={() => confirmDelete(user)}
                            disabled={isCurrentUser(user.id)}
                            title={isCurrentUser(user.id) ? "Nelze smazat vlastní účet" : ""}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Smazat
                          </Button>
                        </div>
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

        {/* Edit User Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Upravit uživatele"
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Input
                label="Uživatelské jméno"
                id="edit-username"
                name="username"
                value={editFormData.username}
                onChange={handleEditInputChange}
                error={editFormErrors.username}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Input
                label="Email"
                id="edit-email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
                error={editFormErrors.email}
                fullWidth
                required
              />
            </div>
            
            <div>
              <Select
                label="Role"
                id="edit-role"
                name="role"
                value={editFormData.role}
                onChange={handleEditInputChange}
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
                onClick={() => setIsEditModalOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isEditing}
                disabled={isEditing}
              >
                Uložit změny
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Smazat uživatele"
          size="sm"
        >
          <div className="p-4">
            <p className="text-gray-700 mb-6">
              Opravdu chcete smazat uživatele <span className="font-bold">{userToDelete?.username}</span>? Tato akce je nevratná.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={isDeleting}
                disabled={isDeleting}
                onClick={handleDeleteUser}
              >
                Smazat
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default withRole(UsersManagementPage, ['admin']);