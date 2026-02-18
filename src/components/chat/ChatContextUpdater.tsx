'use client';

import { useEffect } from 'react';
import { useChatContext } from '@/context/ChatContext';

export function ChatContextUpdater({ data }: { data: any }) {
    const { setContextData } = useChatContext();

    useEffect(() => {
        // When mounting or data changes, update the global chat context
        console.log('ChatContextUpdater: Updating context with shipment data');
        setContextData(data);

        // Optional: Cleanup on unmount?
        // return () => setContextData(null);
        // Better not to clear immediately so user can ask follow-up questions
        // even if they navigate away briefly, or we can clear it.
        // Let's keep it for now.
    }, [data, setContextData]);

    return null; // Render nothing
}
