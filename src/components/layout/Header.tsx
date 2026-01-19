'use client';
import { Search, Calendar, Filter, Download, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
    return (
        <header className="h-[72px] bg-background px-8 flex items-center justify-between sticky top-0 z-10 w-full border-b">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-10 bg-background border-input shadow-none focus-visible:ring-1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>F
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden md:flex ml-auto bg-background h-9">
                        <Calendar className="mr-2 h-4 w-4" />
                        Oct 18 - Nov 18
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 bg-background">
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Filter</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 bg-background">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Export</span>
                    </Button>
                </div>

                <div className="h-8 w-px bg-border mx-2"></div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 border-2 border-background" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
                        <MessageSquare className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-3 pl-2">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="User"
                            className="w-9 h-9 rounded-full bg-muted border border-border"
                        />
                        <div className="hidden lg:block text-left">
                            <p className="text-sm font-semibold text-foreground leading-none">Jesus B.</p>
                            <p className="text-xs text-muted-foreground mt-1">Administrador</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
