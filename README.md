# GitHub Project Catalog & Codegen Agent Dashboard

A comprehensive web application for managing GitHub projects, searching repositories/packages, and controlling Codegen AI agents.

## 🚀 Features

### 🗂️ Project Management
- **Repository Discovery**: Browse and search through GitHub repositories with advanced filtering options
- **Project Organization**: Create custom lists to categorize and manage your projects
- **Real-time Data**: Live repository statistics including stars, forks, and last update information
- **Visual Organization**: Clean, card-based interface for easy project browsing

### 🔍 Enhanced Search
- **Multi-platform Search**: Search across GitHub repositories, code, users, and NPM packages
- **Advanced Filtering**: Filter by language, date range, repository size, and more
- **GitHub Integration**: Direct integration with GitHub API for real-time data
- **NPM Package Discovery**: Search and explore NPM packages with download statistics
- **Trending Projects**: Discover trending repositories by timeframe and language

### 🤖 Codegen Agents Dashboard
- **Agent Run Management**: Create, monitor, and control Codegen agent runs
- **Real-time Dashboard**: Comprehensive overview of agent activities and statistics
- **Live Log Monitoring**: Stream agent logs in real-time with filtering and search
- **Run Controls**: Ban/unban checks, resume runs, and manage PR integration
- **Template Library**: Pre-built prompt templates for common development tasks
- **Multi-modal Support**: Support for text prompts and image inputs
- **Progress Tracking**: Visual indicators and status monitoring for all runs

#### Agent Dashboard Components:
1. **Project Management Dashboard**
   - Repository list with search and filtering
   - Project details, status, and activity tracking
   - Integration with GitHub repositories

2. **Agent Run Management Interface**
   - Create new agent runs with prompts, images, and metadata
   - View all runs with pagination and status filtering
   - Individual run details with control panels
   - Resume completed runs functionality

3. **Logs & Monitoring System**
   - Real-time log viewing with auto-refresh
   - Log filtering by message type and search
   - Export logs to CSV functionality
   - Visual progress indicators and status tracking

4. **Run Control Panel**
   - Ban/unban check controls for agent runs
   - Code generation management (remove from PR)
   - Resume agent runs with new prompts
   - Comprehensive run status management

5. **User & Organization Management**
   - Current user profile display
   - Team member management
   - Organization settings and integrations
   - Integration status monitoring

### 📦 NPM Package Management
- **Package Details**: View comprehensive package information including dependencies
- **Download Statistics**: Real-time download counts and trends
- **Version History**: Track package versions and update cycles
- **Repository Linking**: Direct links to source repositories

## 🎨 Design Features
- Apple-level aesthetics with clean, modern interface
- Responsive design that works on all screen sizes
- Intuitive navigation with sidebar and contextual actions
- Real-time updates with loading states and error handling
- Professional color scheme with proper contrast ratios
- Micro-interactions and hover states throughout

## 🔧 Technical Implementation
- Real API integration using your provided credentials
- TypeScript for type safety and better development experience
- Custom hooks for API calls and async actions
- Modular component architecture for maintainability
- Error handling with user-friendly messages
- Loading states and optimistic updates

## 📊 Key Components
- **Dashboard Overview** - Statistics and recent activity
- **Repository Management** - GitHub repo integration
- **Agent Run Creation** - Full-featured run creation modal
- **Log Monitoring** - Real-time log streaming and analysis
- **Sandbox Analysis** - Log analysis with error detection
- **User Management** - Team member overview
- **Organization Settings** - Org and integration management

## 🛠️ Setup & Configuration

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
VITE_CODEGEN_API_TOKEN=your_codegen_api_token
VITE_CODEGEN_ORG_ID=your_organization_id
VITE_GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
```

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🎯 Usage

The dashboard is now running and ready to use with your real Codegen API credentials. You can:

1. **Browse Projects**: Navigate to the Projects tab to explore GitHub repositories
2. **Search Packages**: Use the Search tab to find repositories and NPM packages
3. **Manage Agents**: Access the Agents tab to create, monitor, and control Codegen agents
4. **Create Agent Runs**: Use pre-built templates or custom prompts to start new agent runs
5. **Monitor Progress**: Watch real-time logs and status updates for all agent activities
6. **Manage Organizations**: View and configure your team and integration settings

## 🔐 Security

- All API tokens are stored securely as environment variables
- Real-time data fetching with proper error handling
- Rate limiting and caching to prevent API abuse
- TypeScript for type safety and reduced runtime errors

## 🤝 Contributing

This project uses modern React with TypeScript, providing a solid foundation for further development and customization.

---

**Ready to get started?** Configure your environment variables and run `npm run dev` to launch your comprehensive project management and Codegen agent control dashboard!