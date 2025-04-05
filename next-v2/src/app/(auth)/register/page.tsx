// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Prosím vyplňtě všechna pole');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Hesla se neshodují');
      return;
    }
    
    if (password.length < 8) {
      setError('Heslo musí být alespoň 8 znaků');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await register(username, email, password, confirmPassword, role);
      // Redirect is handled in the auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Vytvořit nový účet
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
          {error && (
            <div className="mb-4">
              <Alert variant="danger" message={error} />
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                id="username"
                label="Uživatelské jméno"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                autoComplete="username"
              />
            </div>

            <div>
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                id="password"
                label="Heslo"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <Input
                id="confirm-password"
                label="Potrvzení hesla"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <Select
                id="role"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'teacher', label: 'Učitel' },
                ]}
                fullWidth
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                Registrace
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Už máte účet?{' '}
            <Link
              href="/login"
              className="font-semibold leading-6 text-orange-600 hover:text-orange-500"
            >
              Přihlášení
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}