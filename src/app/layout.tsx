import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Sendtous Import Manager',
  description: 'Sistema de Costos de Importación Sendtous',
};

import { auth } from '@/auth';

import { ChatProvider } from '@/context/ChatContext';
import { ChatWidget } from '@/components/chat/ChatWidget'; // Global Widget
import { Toaster } from '@/components/ui/toaster';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        <ChatProvider>
          {session ? (
            <div className="flex min-h-screen">
              {/* Sidebar - Static Width */}
              <aside className="w-64 fixed inset-y-0 left-0 z-50 border-r border-border bg-surface hidden md:block no-print">
                <Sidebar />
              </aside>

              {/* Main Content */}
              <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-h-screen">
                <div className="no-print">
                  <Header />
                </div>
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                  <div className="max-w-7xl mx-auto animate-fade-in relative">
                    {children}
                    <ChatWidget />
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-slate-50">
              {children}
            </div>
          )}
          <Toaster />
        </ChatProvider>
      </body>
    </html>
  );
}
