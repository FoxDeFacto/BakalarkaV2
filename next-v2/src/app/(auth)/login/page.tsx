// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Zadejte jméno i heslo');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await login(username, password);
      // Redirect is handled in the auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba přihlášení. Zkuste to prosím znovu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Přihlášení
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
                label="Uživatelské heslo"
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
                id="password"
                label="Jméno"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                Přihlásit
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  nebo
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Nejste člen?{' '}
              <Link
                href="/register"
                className="font-semibold leading-6 text-orange-600 hover:text-orange-500"
              >
                Zaregistrujte se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}