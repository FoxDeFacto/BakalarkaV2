// src/components/common/LoadingPage.tsx
'use client';

import React from 'react';

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "Načítání obsahu..." }: LoadingPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-6"></div>
      
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
      <p className="text-sm text-gray-500">Prosím vyčkejte, načítáme pro vás data</p>
    </div>
  );
}

export default LoadingPage;