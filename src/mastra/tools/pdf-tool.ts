import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const pdfTool = createTool({
    id: 'pdf-operations',
    description: 'Read and extract text content from PDF files via URL',
    inputSchema: z.object({
        action: z.enum(['read_pdf']),
        url: z.string().url().describe('URL of the PDF file to read'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        data: z.object({
            text: z.string(),
            url: z.string(),
            metadata: z.object({
                pages: z.number().optional(),
                size: z.number().optional(),
            }).optional(),
        }).optional(),
        message: z.string().optional(),
    }),
    execute: async ({ context }) => {
        const { action, url } = context;

        try {
            switch (action) {
                case 'read_pdf':
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
                    }

                    const contentType = response.headers.get('content-type');
                    if (!contentType?.includes('application/pdf')) {
                        throw new Error('URL does not point to a PDF file');
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Parse the PDF and extract text content using dynamic import
                    const pdf = await import('pdf-parse');
                    const pdfData = await pdf.default(buffer);
                    const extractedText = pdfData.text;

                    return {
                        success: true,
                        data: {
                            text: extractedText,
                            url: url,
                            metadata: {
                                pages: pdfData.numpages,
                                size: buffer.length,
                            },
                        },
                        message: 'PDF content extracted successfully',
                    };

                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (exception: unknown) {
            return {
                success: false,
                data: undefined,
                message:
                    exception instanceof Error
                        ? `PDF processing error: ${exception.message}`
                        : `PDF processing error: ${String(exception)}`,
            };
        }
    },
});