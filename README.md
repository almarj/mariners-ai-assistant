# Seattle Mariners AI Assistant

An interactive web application for Seattle Mariners fans featuring real-time stats, game schedules, standings, and an AI-powered assistant using Claude (Anthropic).

## 🌐 Live App

**Visit:** https://mariners-ai-assistant-production-production.up.railway.app

Access from any device - desktop, tablet, or mobile!

## Features

- 🤖 **AI Assistant**: Ask questions about the Mariners using Claude AI
- 📊 **Live Stats**: Real-time player statistics for hitters and pitchers
- 📅 **Game Schedule**: View last 5 games and upcoming games
- 🏆 **Standings**: AL West division and Wild Card standings
- 📰 **News**: Latest Mariners news and updates

## Tech Stack

- **Backend**: Node.js, Express
- **AI**: Claude (Anthropic API)
- **Data Source**: MLB Stats API
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Setup

### Prerequisites

- Node.js 16.0.0 or higher
- Anthropic API key

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd mariners-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3002
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3002
```

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `GET /health` - Health check
- `POST /ask` - Ask AI assistant a question
- `GET /last5` - Get last 5 games
- `GET /next5` - Get next 5 games
- `GET /standings` - Get AL West and Wild Card standings
- `GET /players` - Get player statistics
- `GET /news` - Get latest Mariners news

## Deployment

### Railway/Heroku

1. Set environment variables in your deployment platform
2. Deploy using your platform's deployment method
3. Update the `backendUrl` in `index.html` if needed

### Custom Server

1. Build and deploy the application
2. Ensure Node.js is installed on your server
3. Run `npm start` to start the server
4. Configure your web server (nginx/Apache) to proxy requests

## Color Scheme

The app uses the official Seattle Mariners colors:
- **Navy Blue**: #0C2C56
- **Northwest Green**: #005C5C
- **Silver**: #C4CED4
- **Light Blue**: #8AB8E6

## Credits

- Data provided by [MLB Stats API](https://statsapi.mlb.com)
- AI powered by [Anthropic Claude](https://www.anthropic.com)

## License

MIT
