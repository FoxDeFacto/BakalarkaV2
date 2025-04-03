'use client';

import { useState, useEffect } from 'react';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

function ProfilePage() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Here you would typically call your API to update the user profile
      // For example: await userApi.updateProfile(formData);
      
      // For now, let's simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Účet úspěšně upraven');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při úpravě účtu');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Váš účet</h1>
        
        {success && (
          <Alert variant="success" message={success} />
        )}
        
        {error && (
          <Alert variant="danger" message={error} />
        )}
        
        {/* Profile Information Card */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informace</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upravte své informace
            </p>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="space-y-4">
                <Input
                  label="Uživatelské jméno"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  fullWidth
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  required
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={updating}
                    disabled={updating}
                  >
                    Uložit změny
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>
        
        {/* User Role Info Card */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Další informace</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{user?.role}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Připojil se:</span>
                <span className="font-medium">
                  {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);