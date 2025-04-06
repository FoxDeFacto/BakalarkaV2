// src/app/(auth)/layout.tsx
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-full flex bg-gray-50">
        <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    );
  }