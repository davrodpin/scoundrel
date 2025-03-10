# Scoundrel - A Single Player Rogue-like Card Game

This project is a digital implementation of the card game Scoundrel, originally created by Zach Gage and Kurt Bieg. The implementation was done entirely using [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding), an AI-powered programming practice where developers can describe their intent in natural language and let AI tools generate the implementation.

## About the Game

Scoundrel is a solitaire card game where you explore a dungeon full of monsters, collecting weapons and potions to survive. The goal is to defeat monsters and survive as long as possible.

To understand all the rules and mechanics of the original game, you can check the [official rules PDF](http://www.stfj.net/art/2011/Scoundrel.pdf).

## Vibe Coding

This project was developed using Vibe coding, a natural and efficient way of programming through voice input and AI assistance. All files in this project were created and edited exclusively through AI assistance, with no manual coding involved. The following tools were used:

- [Cursor](https://www.cursor.com/) - AI-powered code editor that serves as the IDE and AI agent, providing intelligent code completion and natural language processing capabilities
- [WhisperTyping](https://whispertyping.com/) - Speech-to-text software that enables voice dictation, powered by OpenAI's Whisper model for accurate transcription

## Technologies Used

All technologies in this project were selected by the AI agent during the development process:

Frontend:
- React + TypeScript
- Vite for build and development
- Material-UI for components
- State management with React Hooks
- Socket.IO client for real-time communication

Backend:
- Node.js + TypeScript
- Express.js for HTTP server
- Socket.IO for WebSocket communication
- In-memory storage for leaderboard

Deployment:
- Frontend hosted on GitHub Pages
- Backend hosted on Render.com

## Play Online

You can play the game online at [https://davrodpin.github.io/scoundrel/](https://davrodpin.github.io/scoundrel/)

## How to Play Offline

This project uses a monorepo structure with both frontend and backend applications.

1. Clone the repository:
   ```bash
   git clone https://github.com/davrodpin/scoundrel.git
   cd scoundrel
   ```

2. Install dependencies for both applications:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create `.env` file in `apps/frontend`:
     ```
     VITE_BACKEND_URL=http://localhost:3001
     ```
   - Create `.env` file in `apps/backend`:
     ```
     PORT=3001
     ```

4. Start the backend service:
   ```bash
   cd apps/backend
   npm run dev
   ```

5. In a new terminal, start the frontend:
   ```bash
   cd apps/frontend
   npm run dev
   ```

6. Open your browser at `http://localhost:5173`

Note: The game requires both frontend and backend services to be running. Without the backend service, features like the leaderboard won't be available.

## Credits

Original game Scoundrel © 2011 Zach Gage & Kurt Bieg. This digital implementation is an unofficial fan project, created for study and entertainment purposes.

## License

This project is distributed under the MIT License. Note that this license applies only to the code implementation, not to the original Scoundrel game and its rules, which are property of their respective creators.