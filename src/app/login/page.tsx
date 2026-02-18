import { LoginForm } from '@/components/auth/LoginForm';
import { Package } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 justify-between bg-white">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
                        <Package className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">Sendtous</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <LoginForm />
                </div>
            </div>

            {/* Right Side - Image/Gradient */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50"></div>

                <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
                    <h2 className="text-4xl font-bold mb-4">Gestión Inteligente de Importaciones</h2>
                    <p className="text-lg text-blue-100 max-w-md">
                        Controla tus costos, gestiona embarques y optimiza tu cadena de suministro en un solo lugar.
                    </p>
                </div>
            </div>
        </div>
    );
}
