// src/components/common/NotFoundPage.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface NotFoundPageProps {
  title?: string;
  message?: string;
  backLink?: string;
  backLabel?: string;
  homeLink?: boolean;
}

export function NotFoundPage({ 
  title = "Stránka nenalezena", 
  message = "Obsah, který hledáte, není k dispozici nebo byl přesunut.",
  backLink = "/", 
  backLabel = "Zpět",
  homeLink = true
}: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <svg
          className="h-16 w-16 text-orange-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">{title}</h1>
      <p className="text-gray-600 text-center max-w-md mb-8">{message}</p>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Link href={backLink}>
          <Button variant="primary">{backLabel}</Button>
        </Link>
        
        {homeLink && backLink !== "/" && (
          <Link href="/">
            <Button variant="outline">Přejít na úvodní stránku</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default NotFoundPage;