'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    contextData: any;
    setContextData: (data: any) => void;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [contextData, setContextData] = useState<any>(null);

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);
    const toggleChat = () => setIsOpen(prev => !prev);

    return (
        <ChatContext.Provider value={{
            isOpen,
            setIsOpen,
            contextData,
            setContextData,
            openChat,
            closeChat,
            toggleChat
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
