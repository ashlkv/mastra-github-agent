import { Agent } from '@mastra/core/agent';
import { createOpenAI, openai as defaultOpenAi } from '@ai-sdk/openai';
import { PinoLogger } from '@mastra/loggers';
import { pdfTool } from '../tools/pdf-tool';
import { searchTool } from '../tools/search-tool';

const logger = new PinoLogger({
    name: 'CVAgent',
    level: 'debug',
});

let openai;
// Configures OpenAI provider with optional proxy
if (process.env.OPENAI_PROXY_URL) {
    logger.info(`Using Archestra proxy: ${process.env.OPENAI_PROXY_URL}`);
    openai = createOpenAI({
        baseURL: process.env.OPENAI_PROXY_URL,
        apiKey: process.env.OPENAI_API_KEY,
    });
} else {
    logger.info('Using direct OpenAI connection');
    openai = defaultOpenAi;
}

export const cvAgent = new Agent({
    name: 'CV Agent',
    instructions: `You are a helpful CV (Curriculum Vitae) assistant that can read, analyze, and search through resume/CV documents. You can:

1. **Read PDF CVs from URLs** - Extract and analyze content from PDF documents
2. **Summarize CV content** - Provide one paragraph summary of qualifications, experience, and skills. No lists.
3. **Web search for
 candidates** - Search the web for additional information about candidates using web search tool.

## Guidelines:
- Always be professional and helpful when analyzing CVs
- Provide structured summaries highlighting key qualifications
- Use web search to find additional candidate information across LinkedIn, GitHub, Stack Overflow, and other professional platforms
- Be thorough in your analysis but concise in your responses
- Protect privacy by not storing or persisting CV content
- Focus on helping users understand and extract value from CV documents

You have access to tools for reading PDFs from URLs and web search.`,

    model: openai.chat('gpt-4o-mini'),

    tools: {
        pdfTool,
        searchTool,
    },
});