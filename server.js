require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Security Package

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// 🔥 HIGH-SPEED IN-MEMORY CACHE
let globalCards = [];
let globalMembers = [];
let isDbConnected = false;

// ==========================================
// 1. DATABASE MODELS
// ==========================================
const userSchema = new mongoose.Schema({ name: String, email: String, role: String, status: String, color: String, boardId: String });
const User = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
    id: String, taskId: String, title: String, description: String, status: String,
    priority: String, tag: String, assignee: String, assigneeName: String,
    assigneeEmail: String, comments: Number, dueDate: String, boardId: String
});
const Task = mongoose.model('Task', taskSchema);

// ==========================================
// 2. BULLETPROOF MONGODB CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-kanban-db', {
  serverSelectionTimeoutMS: 2000 // 2 sec me timeout ho kar RAM par switch karega
})
  .then(async () => {
    console.log('📦 MongoDB Connected! Data is permanent.');
    isDbConnected = true;
    const savedTasks = await Task.find({});
    if (savedTasks.length > 0) globalCards = savedTasks;
    const savedUsers = await User.find({});
    if (savedUsers.length > 0) globalMembers = savedUsers; // Members load
  })
  .catch(err => {
    console.log('⚠️ MongoDB connection skipped. Running smoothly on High-Speed RAM.');
    isDbConnected = false;
  });

// ==========================================
// 3. SECURE AUTHENTICATION API
// ==========================================
app.post('/api/auth', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and Email are required" });

  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#10B981'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const userPayload = { name, email, role, color: randomColor };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

  console.log(`🔐 New Secure Login: ${name} (${email})`);
  res.json({ token, user: userPayload });
});

// ==========================================
// 4. AI AGENT & ASSISTANT APIS (Live Gemini)
// ==========================================
// A. Task Breakdown API (For Modal)
// ==========================================
// 4. AI AGENT & ASSISTANT APIS (Updated to Gemini 3.6 Flash)
// ==========================================

// A. Task Breakdown API (For Modal)
app.post('/api/ai/breakdown', async (req, res) => {
  try {
    const { taskTitle } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY || API_KEY.includes('YOUR_')) {
      return res.status(400).json({ error: 'Please set a valid GEMINI_API_KEY in your .env file.' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Act as an expert Technical Project Manager. Break this task down into 4-6 highly detailed, actionable subtasks using bullet points. At the end, provide 'Estimated Effort'. Task Title: "${taskTitle}"` }] }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ subtasks: data.candidates[0].content.parts[0].text });
  } catch (error) { 
    res.status(500).json({ error: 'Failed to generate AI breakdown.' }); 
  }
});

// B. Live Workspace AI Assistant (For Chat Tab)
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { message, cards } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY || API_KEY.includes('YOUR_')) {
      return res.status(400).json({ error: 'Please set a valid GEMINI_API_KEY in your .env file.' });
    }

    const tasksSummary = (cards || []).map(c => `• [${c.taskId}] "${c.title}" | Status: ${c.status} | Priority: ${c.priority} | Tag: ${c.tag} | Assigned: ${c.assigneeName || 'Unassigned'}`).join('\n');

    const prompt = `You are an elite Agile Project Copilot for this live Kanban workspace.
Current Tasks on Board:
${tasksSummary || 'No tasks currently created.'}

User Query: "${message}"

Provide a concise, direct, helpful response tailored specifically to the project data above. Use bullet points and clean formatting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ reply: data.candidates[0].content.parts[0].text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process AI assistant query.' });
  }
});

// ==========================================
// 5. SOCKET.IO JWT SECURITY MIDDLEWARE
// ==========================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication Error: No Token Provided"));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication Error: Invalid Token"));
    socket.user = decoded;
    next();
  });
});

// ==========================================
// 6. REAL-TIME SOCKET LOGIC
// ==========================================
io.on('connection', (socket) => {
  socket.on('join-board', async (userData) => {
    socket.join(userData.boardId);

    const exists = globalMembers.find(m => m.email === userData.email);
    if (!exists && userData.email) {
      globalMembers.push(userData);

      socket.to(userData.boardId).emit('new-notification-broadcast', {
        title: 'Secure Connection Established 🟢',
        desc: `${userData.name} securely joined the workspace.`, time: 'Just now', bg: '#D1FAE5'
      });
    } else if (exists) {
      exists.status = 'Online 🟢';
    }

    // Live Team Synchronization
    io.emit('update-team-members', globalMembers);
    socket.emit('update-board', { boardId: userData.boardId, cards: globalCards });

    if (isDbConnected && userData.email) {
      try {
        const existingUser = await User.findOne({ email: userData.email, boardId: userData.boardId });
        if (!existingUser) await User.create(userData);
      } catch (e) { }
    }
  });

  socket.on('card-moved', async (data) => {
    globalCards = data.cards;
    socket.to(data.boardId).emit('update-board', data);
    if (isDbConnected) {
      try {
        await Task.deleteMany({ boardId: data.boardId });
        const tasksToInsert = data.cards.map(c => ({ ...c, boardId: data.boardId }));
        if (tasksToInsert.length > 0) await Task.insertMany(tasksToInsert);
      } catch (e) { }
    }
  });

  socket.on('new-notification', (data) => {
    socket.to(data.boardId).emit('new-notification-broadcast', data.notification);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Secure Server Port ${PORT} par live hai!`));