# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mastra application - a framework for building AI agents, tools, and workflows. The project uses TypeScript with ES modules and targets Node.js 20.9.0+.

## Development Commands

- `npm run dev` - Start the Mastra development server
- `npm run build` - Build the application
- `npm run start` - Start the built application
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once

## Project Architecture

### Core Structure
- **src/mastra/index.ts** - Main Mastra configuration file that exports the configured `mastra` instance
- **src/mastra/agents/** - AI agents (weatherAgent, githubAgent)
- **src/mastra/tools/** - Tools used by agents (weatherTool, githubTool)
- **src/mastra/workflows/** - Workflow definitions (weatherWorkflow)

### Key Configuration
The main Mastra instance is configured with:
- **Storage**: LibSQLStore using in-memory database (":memory:") for development
- **Logger**: PinoLogger for structured logging
- **Observability**: Enabled with default exporter for AI tracing
- **Telemetry**: Disabled (deprecated as of Nov 4th release)

### Agents
- **weatherAgent**: Uses OpenAI GPT-4o-mini model with weather tool access and persistent memory
- **githubAgent**: Uses OpenAI GPT-4o model for GitHub repository interactions

### Tools
- **weatherTool**: Fetches current weather data using Open-Meteo API
- **githubTool**: Comprehensive GitHub API integration (issues, files, repositories)

### Workflows
- **weatherWorkflow**: Multi-step workflow that fetches weather data and suggests activities

## Environment Setup

- Requires `.env` file with `OPENAI_API_KEY`
- Optional `GITHUB_TOKEN` for GitHub API write operations
- Database files are stored in `.mastra/` directory

## Important Notes

- Uses ES modules (`"type": "module"` in package.json)
- TypeScript configuration targets ES2022 with bundler module resolution
- Memory storage uses file:../mastra.db for agents (relative to .mastra/output directory)
- Weather tool integrates with Open-Meteo geocoding and forecast APIs
- GitHub tool supports both read and write operations with proper authentication