import { OpenAI } from 'openai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai'; // Correct adapter
import { SYSTEM_PROMPT } from '@/components/chat/SystemPrompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // Create an OpenAI provider instance
    // The 'openai' package automatically looks for OPENAI_API_KEY environment variable.
    // Check DB for API Key first, fallback to env
    const { getSystemConfig } = await import('@/app/actions/settings');
    const dbConfig = await getSystemConfig('OPENAI_API_KEY');
    const apiKey = dbConfig.success && dbConfig.data ? dbConfig.data : process.env.OPENAI_API_KEY;

    console.log('[API/chat] API Key found:', !!apiKey, 'Length:', apiKey?.length);

    if (!apiKey) {
        console.error('[API/chat] Missing OpenAI API Key');
        return new Response('OpenAI API Key not configured', { status: 500 });
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const parsedMessages = messages.map((m: any) => {
        // Handle both legacy content string and new parts array
        let content = m.content;
        if (!content && m.parts) {
            content = m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('');
        }
        return {
            role: m.role,
            content: content || '',
        };
    });

    const { prisma } = await import('@/lib/prisma');

    // Fetch full context from database
    const [products, activeShipments, recentShipments, suppliers] = await Promise.all([
        prisma.product.findMany({
            where: { isActive: true },
            select: { id: true, name: true, sku: true, priceFob: true, supplier: { select: { name: true } } },
            take: 50
        }),
        // Ensure we ALWAYS get valid "In Transit" shipments for the chat
        prisma.shipment.findMany({
            where: {
                status: 'IN_TRANSIT'
            },
            select: {
                id: true,
                reference: true,
                status: true,
                supplier: { select: { name: true } },
                items: {
                    take: 20, // Limit items per shipment
                    select: {
                        product: { select: { name: true } },
                        quantity: true,
                        unitCostClp: true
                    }
                },
                costLines: {
                    select: { description: true, amount: true, currency: true }
                }
            }
        }),
        // Get recent others for context
        prisma.shipment.findMany({
            where: {
                status: { not: 'IN_TRANSIT' }
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Reduced from 15 to 5
            select: {
                id: true,
                reference: true,
                status: true,
                supplier: { select: { name: true } }
            }
        }),
        prisma.supplier.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        })
    ]);

    const fullContext = {
        contexto_navegacion: context, // Context from client (e.g. current page)
        base_de_datos: {
            productos: products,
            embarques_activos_transito: activeShipments,
            otros_embarques_recientes: recentShipments,
            proveedores: suppliers,
            fecha_actual: new Date().toISOString()
        }
    };

    console.log('[API/chat] Sending messages to OpenAI:', JSON.stringify(parsedMessages, null, 2));

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `${SYSTEM_PROMPT}\n\nDATOS ACTUALES DEL SISTEMA:\n${JSON.stringify(fullContext, null, 2)}` },
                ...parsedMessages
            ],
        });

        console.log('[API/chat] Response received from OpenAI');
        return Response.json(completion);

    } catch (error: any) {
        console.error('[API/chat] Error during OpenAI call:', error);
        const errorMessage = error?.message || 'Unknown error during OpenAI call';
        return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
    }
}
