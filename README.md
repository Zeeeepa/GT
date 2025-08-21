<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Codegen Agent Management UI

A modern web application for managing Codegen agents, featuring agent run creation, monitoring, and resuming functionality.

## Features

- Create new agent runs with repository selection
- Monitor active agent runs in real-time
- Resume agent runs with new prompts
- Filter and sort agent runs by status and date
- View detailed agent run metadata and steps

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- GitHub account with a personal access token
- Codegen account with API token and organization ID

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Zeeeepa/GT.git
cd GT
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the provided `.env.sample`:

```bash
cp .env.sample .env
```

4. Edit the `.env` file and add your tokens and IDs:

```
# GitHub Authentication
VITE_GITHUB_TOKEN=your_github_token_here

# Codegen Configuration
VITE_CODEGEN_TOKEN=your_codegen_token_here
VITE_CODEGEN_ORG_ID=your_codegen_org_id_here

# API URLs
VITE_API_BASE_URL=https://api.codegen.com
VITE_GITHUB_API_URL=https://api.github.com
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

### Building for Production

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The production build will be available at http://localhost:4173.

## Deployment

### Deploying to a Static Hosting Service

1. Build the application:

```bash
npm run build
```

2. Deploy the `dist` directory to your preferred static hosting service (Netlify, Vercel, GitHub Pages, etc.).

### Environment Variables for Production

When deploying to a production environment, make sure to set the following environment variables:

- `VITE_GITHUB_TOKEN`: Your GitHub personal access token
- `VITE_CODEGEN_TOKEN`: Your Codegen API token
- `VITE_CODEGEN_ORG_ID`: Your Codegen organization ID
- `VITE_API_BASE_URL`: The Codegen API base URL (default: https://api.codegen.com)
- `VITE_GITHUB_API_URL`: The GitHub API URL (default: https://api.github.com)

## Testing

The application includes comprehensive testing infrastructure to ensure code quality and prevent regressions.

### Running Tests

Run all component tests:

```bash
npm run test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

View test coverage report:

```bash
npm run test:coverage
```

Run integration tests:

```bash
npm run test:integration
```

Run visual regression tests:

```bash
npm run test:visual
```

### Test Structure

- **Component Tests**: Located in `tests/components/` directory, these test individual UI components in isolation.
- **Integration Tests**: Located in `tests/integration/` directory, these test the interaction between components and services.
- **Visual Regression Tests**: Located in `tests/visual/` directory, these capture screenshots of components and compare them against baseline images to detect visual changes.

### Continuous Integration

The repository includes GitHub Actions workflows for automated testing:

- **UI Component Tests**: Runs component tests on every PR and push to main branch.
- **Integration Tests**: Validates API integration with actual prompt templates.
- **Visual Regression Tests**: Detects visual changes in the UI and requires approval for intentional changes.

## API Documentation

The application uses the Codegen API for agent management. For more information, see the [API documentation](https://docs.codegen.com/api-reference/agents/resume-agent-run).
