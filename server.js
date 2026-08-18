const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🧠 NAYA: In-Memory Database (Server chalne tak data yahan save rahega)
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

  // Jab user website kholta hai, toh server apni memory se data bhejta hai
  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    socket.emit('update-board', { cards: boardData });
  });

  // Jab user task add/move karta hai
  socket.on('card-moved', (data) => {
    boardData = data.cards; // Server ki memory update ho jati hai
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
      model: 'gemini-2.5-flash',
      contents: `Break down the following project task into 3 to 5 actionable subtasks. Return as a clean bulleted list: "${taskTitle}"`,
    });
    res.json({ subtasks: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));