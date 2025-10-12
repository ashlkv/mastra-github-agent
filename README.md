# Mastra GitHub Agent

A template project for [Mastra](https://mastra.ai) featuring a basic GitHub agent.

1. Use the repository link as template with `@mastra/cli` when creating a new project
```bash
npx create-mastra@latest --template https://github.com/ashlkv/mastra-github-agent
```

2. Change to project directory and set up environment
```bash
cd mastra-github-agent
cp .env.example .env
# Add your OPENAI_API_KEY and GITHUB_TOKEN to .env file
```

3. Start the app in development mode
```bash
npm run dev
```

- [Mastra CLI Reference](https://mastra.ai/en/reference/cli/create-mastra)