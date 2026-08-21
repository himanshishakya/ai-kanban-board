const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();

// 🧠 NAYA CORS SETUP: Sirf in 2 websites ko allow karega (Very Secure)
app.use(cors({
    origin: ["http://localhost:5173", "https://cool-brioche-e3b02b.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// 🧠 SOCKET.IO CORS SETUP
const io = new Server(server, { 
    cors: { 
        origin: ["http://localhost:5173", "https://cool-brioche-e3b02b.netlify.app"],
        methods: ["GET", "POST"],
        credentials: true
    } 
});

// In-Memory Database
let boardData = [
  { id: '1', title: 'Frontend UI Design', status: 'Todo', priority: 'High', time: '17 Aug, 10:00 AM' },
  { id: '2', title: 'Integrate Gemini AI', status: 'Done', priority: 'High', time: '17 Aug, 10:15 AM' }
];

// AI Setup
let ai;
try { ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); } 
catch(err) { console.log("Warning: Gemini API Key set nahi hai!"); }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    socket.emit('update-board', { cards: boardData });
  });

  socket.on('card-moved', (data) => {
    boardData = data.cards; 
    socket.to(data.boardId).emit('update-board', data);
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// AI API Route
app.post('/api/ai/breakdown', async (req, res) => {
  try {
    const { taskTitle } = req.body;
    if (!ai) return res.status(400).json({error: "Backend me API key missing hai."});
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Break down the following project task into 3 to 5 actionable subtasks. Return as a clean bulleted list: "${taskTitle}"`,
    });
    res.json({ subtasks: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
