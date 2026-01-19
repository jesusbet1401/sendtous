'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Users,
    Ship,
    Settings,
    BarChart3,
    FileText,
    ChevronLeft,
    ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const menuGroups = [
    {
        title: 'GENERAL',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: Ship, label: 'Embarques', href: '/shipments' },
        ]
    },
    {
        title: 'GESTIÓN',
        items: [
            { icon: Users, label: 'Proveedores', href: '/suppliers' },
            { icon: Package, label: 'Productos', href: '/products' },
        ]
    },
    {
        title: 'HERRAMIENTAS',
        items: [
            { icon: BarChart3, label: 'Simulación', href: '/simulations' },
            { icon: FileText, label: 'Reportes', href: '/reports' },
        ]
    },
    {
        title: 'SOPORTE',
        items: [
            { icon: Settings, label: 'Configuración', href: '/settings' },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
            {/* Header / Logo */}
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        Sendtous
                    </span>
                </div><button className="text-slate-400 hover:text-slate-600">
                    {/* <ChevronLeft size={20} /> */}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {menuGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        <h4 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {group.title}
                        </h4>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-sm font-medium",
                                            isActive
                                                ? "bg-teal-50 text-teal-700"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                        )}
                                    >
                                        <item.icon
                                            size={20}
                                            className={clsx(
                                                "stroke-[1.5px]",
                                                isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"
                                            )}
                                        />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User / Workspace */}
            <div className="p-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jesus"
                        alt="User"
                        className="w-9 h-9 rounded-full bg-slate-100"
                    />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-700 truncate">Jesus Betancourt</p>
                        <p className="text-xs text-slate-500 truncate">Sendtous</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                </div>
            </div>
        </div>
    );
}
