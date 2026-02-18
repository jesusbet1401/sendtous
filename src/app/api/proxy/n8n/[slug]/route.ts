import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;
    const targetUrl = `https://n8n.hifi.cl/webhook/${slug}`;

    console.log(`[Proxy] Forwarding request to: ${targetUrl}`);

    try {
        const contentType = req.headers.get('content-type') || '';

        let body: any;
        let headers: Record<string, string> = {};

        // If it's a file upload (multipart/form-data)
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();

            // Re-construct FormData to send upstream
            // We can't just pass the incoming formData directly sometimes due to boundary issues
            const newFormData = new FormData();
            for (const [key, value] of formData.entries()) {
                newFormData.append(key, value);
            }
            body = newFormData;
            // Fetch will set the correct Content-Type with boundary for FormData
        }
        // If it's JSON
        else if (contentType.includes('application/json')) {
            body = JSON.stringify(await req.json());
            headers['Content-Type'] = 'application/json';
        }
        // text/plain etc.
        else {
            body = await req.text();
            if (contentType) headers['Content-Type'] = contentType;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        console.log(`[Proxy] Response status from n8n: ${response.status}`);

        // Get the response body as a buffer/blob to preserve binary data (like PDF/CSV)
        const responseBody = await response.blob();

        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                // Forward key headers
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Content-Disposition': response.headers.get('Content-Disposition') || '',
            },
        });

    } catch (error: any) {
        console.error('[Proxy] Error forwarding request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
