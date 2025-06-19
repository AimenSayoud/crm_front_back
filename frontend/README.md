# RecPlus CRM

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI Assistant Integration

The RecPlus CRM includes an AI Assistant powered by OpenAI's API that helps with recruiting tasks such as:

- Generating personalized email templates for candidates and companies
- Creating role-specific interview questions
- Drafting comprehensive job descriptions
- Writing candidate feedback and assessments
- Providing context-aware responses to recruitment queries

### Setup

1. **Get an OpenAI API Key**:

   - Sign up for an account at [OpenAI](https://platform.openai.com/) if you don't have one
   - Navigate to the API section and create a new API key

2. **Configure Environment Variables**:

   - Copy the `.env.local.example` file to create a new file named `.env.local` in the root directory of the project
   - Add your OpenAI API key to the file:
     ```
     NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_goes_here
     NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
     NEXT_PUBLIC_USE_MOCK_DATA=true
     ```
   - Set `NEXT_PUBLIC_USE_MOCK_DATA=false` when connecting to a real backend
   - Set `NEXT_PUBLIC_USE_MOCK_DATA=true` to use mock data for testing

3. **Verify OpenAI Service Configuration**:
   - The AI integration is implemented in `/src/lib/openai-service.ts`
   - The environment variable is accessed in this file:
     ```typescript
     const OPENAI_API_KEY =
       process.env.NEXT_PUBLIC_OPENAI_API_KEY || "your-api-key-here";
     ```
   - When deploying to production, ensure your environment variables are set in your hosting platform

### AI Service Architecture

The AI integration follows this architecture:

1. **Frontend Components**:

   - `src/app/ai-assistant/page.tsx`: Main AI Assistant interface with chat, slash commands, and entity selection
   - `src/components/ui/SlashCommandMenu.tsx`: Implements the slash command dropdown menu
   - `src/components/ui/EntitySearchMenu.tsx`: Provides search functionality for candidates and companies

2. **OpenAI Service**:

   - `src/lib/openai-service.ts`: Core service that handles API communication with OpenAI
   - Implements various specialized functions for different AI capabilities:
     - `generateChatCompletion`: Base function for OpenAI API calls
     - `generateCandidateEmail`: Creates personalized emails for candidates
     - `generateCompanyEmail`: Creates emails for company contacts
     - `generateInterviewQuestions`: Creates questions based on job descriptions
     - `generatePositionInterviewQuestions`: Creates questions for specific positions
     - `generateJobDescription`: Creates detailed job descriptions
     - `generateCandidateFeedback`: Creates candidate assessments
     - `processGeneralQuery`: Handles general recruitment questions

3. **Integration Flow**:
   - User interacts with the AI Assistant interface
   - User can select candidates/companies for context
   - User queries are processed by the AI assistant
   - Specialized AI functions are called based on query intent
   - OpenAI API responds with generated content
   - Content is displayed in the chat interface

### Using the AI Assistant

The AI Assistant can be accessed from the sidebar menu. Key features include:

1. **Slash Commands**: Type `/` to access commands for:

   - Searching candidates
   - Searching companies
   - Generating emails
   - Creating interview questions
   - Writing job descriptions
   - Generating candidate feedback

2. **Entity Context**: Select a candidate or company to:

   - Generate personalized content about that entity
   - Create tailored emails, feedback or interview questions
   - The AI remembers the selected entity for follow-up questions

3. **Quick Actions**: Use the quick action buttons for common tasks like:
   - Email templates
   - Interview questions
   - Job descriptions
   - Feedback templates

### API Usage and Limitations

- The current implementation uses the **GPT-4o-mini** model
- The model offers a good balance between cost and performance compared to GPT-4o or GPT-3.5 Turbo
- Remember to implement monitoring of API usage to control costs
- Consider implementing rate limiting for production environments to manage usage
- The model choice can be changed in the `openai-service.ts` file by modifying the `model` parameter

### Testing without an API Key

For development and testing without using OpenAI credits:

- Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in your `.env.local` file to use mock data
- With this setting, the application will use the fallback data in `api-fallback.ts` instead of making real API calls
- This allows you to test the AI assistant UI and functionality without consuming OpenAI credits
- The mock implementation will simulate API responses and delays to provide a realistic experience

To use a completely different mock API:

- Edit the `API_URL` in `openai-service.ts` to point to a mock API endpoint
- Implement a mock server that responds with compatible JSON responses
- Or use a service like MockAPI or other mock API tools

### Troubleshooting

If you encounter issues while running the project:

1. **Development Server Errors**:

   - Try running without Turbopack: `npm run dev` (instead of `npm run dev:turbo`)
   - Clear Next.js cache: `rm -rf .next` and restart the server
   - Check for TypeScript errors: `npm run type-check`

2. **OpenAI API Issues**:

   - Verify your API key is correctly set in `.env.local`
   - Ensure the model name 'gpt-4o-mini' in `openai-service.ts` is available with your OpenAI account
   - If needed, you can change the model to 'gpt-3.5-turbo' which is available on all OpenAI accounts
   - Use `NEXT_PUBLIC_USE_MOCK_DATA=true` to bypass API calls during development

3. **Component Rendering Errors**:

   - Check the browser console for specific errors
   - Components with potential null/undefined values have been fixed with optional chaining
   - If you encounter "Cannot read properties of undefined" errors, add additional null checks

4. **Environment Variable Issues**:
   - Make sure you have a `.env.local` file with the required variables
   - Restart the development server after changing environment variables
   - Check that Next.js is properly loading variables (they should be available in `process.env`)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

For more information about the OpenAI API:

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Chat Completions Guide](https://platform.openai.com/docs/guides/text-generation)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
