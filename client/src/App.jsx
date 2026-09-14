import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  LayoutDashboard, Kanban, Folder, Sparkles, BarChart2, Bell, 
  FolderCheck, Tag, Home, ChevronDown, Search as SearchIcon, X, 
  Users, Calendar as CalendarIcon, Code2, Database, 
  Activity, ArrowRight, ShieldCheck, Clock, Layers, Loader2, Link, Plus, BookOpen, CheckCircle2, Send
} from 'lucide-react';

const SOCKET_URL = 'window.location.origin';
const socket = io(SOCKET_URL, { autoConnect: false });

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('kanbanUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [boardId] = useState('main-workspace');
  const [cards, setCards] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinRole, setJoinRole] = useState('Frontend Developer');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskTag, setNewTaskTag] = useState('Backend');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  
  // AI Breakdown states (Inside Task Modal)
  const [aiOutput, setAiOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  // AI Assistant Tab states (Live Interactive Chat)
  const [aiCommand, setAiCommand] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'ai', text: '👋 Hello! I am your Workspace AI Copilot. Ask me to generate a daily standup, analyze sprint health, or give technical recommendations!' }
  ]);
  
  const [activePrimaryTab, setActivePrimaryTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Active Projects');

  const [notificationsList, setNotificationsList] = useState([
    { title: 'Secure Workspace Ready', desc: 'JWT Authentication & Live Sync active.', time: 'Active', icon: <ShieldCheck size={18} color="#10B981"/>, bg: '#D1FAE5' }
  ]);

  const columns = ['To Do', 'In Progress', 'On Hold', 'Done'];

  useEffect(() => {
    if (user) {
      const token = sessionStorage.getItem('kanbanToken');
      socket.auth = { token };
      socket.connect();

      socket.on('connect', () => {
          socket.emit('join-board', { 
            boardId, name: user.username, email: user.email, 
            role: user.role, status: 'Online 🟢', color: user.color 
          });
      });

      socket.on("connect_error", (err) => {
          alert("Security Error: " + err.message + ". Please login again.");
          sessionStorage.clear();
          setUser(null);
      });

      socket.on('update-board', (data) => {
        if (data && data.cards) setCards(data.cards);
      });

      socket.on('update-team-members', (updatedList) => {
        if (Array.isArray(updatedList)) {
          setTeamMembers(updatedList);
        }
      });

      socket.on('new-notification-broadcast', (notif) => {
        setNotificationsList(prev => [notif, ...prev]);
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('update-board');
        socket.off('update-team-members');
        socket.off('new-notification-broadcast');
        socket.disconnect();
      };
    }
  }, [user, boardId]);

  const updateCards = (newCards) => {
    setCards(newCards);
    socket.emit('card-moved', { boardId, cards: newCards }); 
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinName.trim() || !joinEmail.trim()) return;
    setIsLoggingIn(true);

    try {
        // ✅ CORRECT API ROUTE: /api/auth
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: joinName.trim(), email: joinEmail.trim().toLowerCase(), role: joinRole })
        });
         
        const data = await res.json();
        if (data.token) {
            sessionStorage.setItem('kanbanToken', data.token);
            const loggedUser = { username: data.user.name, email: data.user.email, role: data.user.role, color: data.user.color };
            sessionStorage.setItem('kanbanUser', JSON.stringify(loggedUser));
            setUser(loggedUser);
        } else {
            alert("Login Failed: " + data.error);
        }
    } catch (err) {
        alert("Failed to connect to the backend security server.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    const textArea = document.createElement("textarea");
    textArea.value = url; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); alert("Secure Link Copied Successfully!"); } 
    catch (err) { alert("Failed to copy."); }
    document.body.removeChild(textArea);
  };

  // 🔥 LIVE AI ASSISTANT API
  const triggerAIAssistantQuery = async (queryText) => {
    const promptToRun = queryText || aiCommand;
    if (!promptToRun.trim()) return;

    setAiChatMessages(prev => [...prev, { sender: 'user', text: promptToRun }]);
    setAiCommand('');
    setIsAssistantThinking(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptToRun, cards })
      });

      const data = await response.json();
      if (data.reply) {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: '⚠️ ' + (data.error || 'Could not fetch AI response. Verify your .env GEMINI_API_KEY.') }]);
      }
    } catch (err) {
      setAiChatMessages(prev => [...prev, { sender: 'ai', text: '🚨 Backend Server Unreachable: Ensure node server.js is running.' }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // 🔥 LIVE AI SUBTASKS BREAKDOWN API
  const generateAISubtasks = async (title, e) => {
    if(e) e.stopPropagation();
    setIsAiLoading(true); setAiOutput(''); setAiPreview(null);
  
    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: title })
      });

      const data = await response.json();
      if (data.subtasks) {
        setAiPreview(data.subtasks);
      } else {
        setAiOutput("⚠️ " + (data.error || "Please check GEMINI_API_KEY in your .env file."));
      }
    } catch (error) {
      setAiOutput("🚨 Backend Server Connection Error.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F8FAFC', justifyContent: 'center', alignItems: 'center', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ background: '#fff', padding: '48px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '16px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', marginBottom: '24px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'}}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px 0' }}>Secure Entry</h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '32px' }}>Protected by JWT Authentication & Real-Time Sync.</p>

          <form onSubmit={handleJoinWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Full Name *</label>
              <input type="text" placeholder="e.g. Himanshi Shakya" value={joinName} onChange={(e) => setJoinName(e.target.value)} required style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Work Email *</label>
              <input type="email" placeholder="e.g. himanshi@workspace.com" value={joinEmail} onChange={(e) => setJoinEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Engineering Role *</label>
              <select value={joinRole} onChange={(e) => setJoinRole(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '15px', boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}>
                <option>Lead Developer</option><option>Frontend Developer</option><option>Backend Developer</option><option>QA Automation</option><option>DevOps Engineer</option>
              </select>
            </div>
            <button type="submit" disabled={isLoggingIn} style={{ width: '100%', padding: '16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '16px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', marginTop: '12px', transition: '0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {isLoggingIn ? <Loader2 className="animate-spin" size={20} style={{ animation: 'spin 1s linear infinite' }}/> : 'Generate Token & Join'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleAddTask = () => {
    if (newTaskTitle.trim() === '') return; 
    const randomId = Math.floor(Math.random() * 1000) + 100;
    const formattedDate = new Date(new Date().setDate(new Date().getDate() + Math.floor(Math.random() * 10)))
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const newTask = {
      id: Date.now().toString(), taskId: `KB-${randomId}`, title: newTaskTitle, description: '', status: 'To Do', priority: newTaskPriority, tag: newTaskTag, 
      assignee: getInitials(user.username), assigneeName: user.username, assigneeEmail: user.email, comments: 0, attachments: 0, dueDate: formattedDate
    };
    updateCards([...cards, newTask]);
    setNewTaskTitle(''); 
  };

  const loadDemoSprint = () => {
    const demoTasks = [
      { id: '1', taskId: 'KB-402', title: 'Design REST API for User Auth', status: 'To Do', priority: 'High', tag: 'Backend', assignee: getInitials(user.username), assigneeName: user.username, assigneeEmail: user.email, comments: 4, attachments: 2, dueDate: 'Nov 12' },
      { id: '2', taskId: 'KB-405', title: 'Fix Navigation CSS Bug on Mobile', status: 'In Progress', priority: 'Medium', tag: 'Frontend', assignee: getInitials(user.username), assigneeName: user.username, assigneeEmail: user.email, comments: 1, attachments: 0, dueDate: 'Nov 10' }
    ];
    updateCards(demoTasks);
  };

  const handleDeleteTask = (id, e) => {
    if(e) e.stopPropagation();
    updateCards(cards.filter(card => card.id !== id));
    if(selectedTask && selectedTask.id === id) setSelectedTask(null);
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const cardToMove = cards.find(c => c.id === draggableId);
    const remainingCards = cards.filter(c => c.id !== draggableId);
    const updatedCard = { ...cardToMove, status: destination.droppableId };
  
    const destCards = remainingCards.filter(c => c.status === destination.droppableId);
    destCards.splice(destination.index, 0, updatedCard);
    const otherCards = remainingCards.filter(c => c.status !== destination.droppableId);
    updateCards([...otherCards, ...destCards]);
  };

  const handleUpdateTaskDescription = (newDesc) => {
    if (!selectedTask) return;
    const updatedCards = cards.map(c => c.id === selectedTask.id ? { ...c, description: newDesc } : c);
    setSelectedTask({ ...selectedTask, description: newDesc });
    updateCards(updatedCards);
  };

  const handleAcceptAIPreview = () => {
    if (!selectedTask || !aiPreview) return;
    handleUpdateTaskDescription(selectedTask.description ? `${selectedTask.description}\n\n### AI Plan\n${aiPreview}` : `### AI Plan\n${aiPreview}`);
    setAiPreview(null);
  };

  const handleOpenTask = (card) => {
    setSelectedTask(card); setAiOutput(''); setAiPreview(null); setIsAiLoading(false);
  };

  const theme = { primarySidebar: '#1E293B', secondarySidebar: '#ffffff', bg: '#F8FAFC', text: '#0F172A', border: '#E2E8F0', sidebarText: '#64748B', accent: '#3B82F6' };
  const getPriorityBorderColor = (p) => p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#3B82F6';
  const getTagColor = (t) => t === 'Backend' ? {bg:'#DCFCE7', c:'#166534'} : t === 'Frontend' ? {bg:'#DBEAFE', c:'#1E40AF'} : t === 'QA' ? {bg:'#FEF3C7', c:'#92400E'} : {bg:'#F3E8FF', c:'#6B21A8'};
  
  const PrimaryIcon = ({ id, Icon, label }) => {
    const isActive = activePrimaryTab === id;
    return (
      <div onClick={() => setActivePrimaryTab(id)} title={label} className="primary-nav-icon"
        style={{ width: '48px', height: '48px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', borderLeft: isActive ? `3px solid ${theme.accent}` : '3px solid transparent', color: isActive ? '#fff' : '#94A3B8' }} >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
    );
  };

  const SidebarItem = ({ icon, label, iconColor, count }) => {
    const isActive = activeSidebarItem === label;
    return (
      <div className="secondary-nav-item" onClick={() => { setActiveSidebarItem(label); setActivePrimaryTab('Dashboard'); }}
        style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isActive ? '#EFF6FF' : 'transparent', color: isActive ? theme.accent : theme.sidebarText, fontWeight: isActive ? '600' : '500', transition: 'all 0.2s ease', border: '1px solid transparent', borderColor: isActive ? '#BFDBFE' : 'transparent' }} >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', color: isActive ? theme.accent : iconColor || theme.sidebarText }}>{icon}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        </div>
        {count !== undefined && (
          <span style={{ background: isActive ? '#3B82F6' : '#F1F5F9', color: isActive ? '#fff' : '#64748B', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', transition: '0.2s' }}>{count}</span>
        )}
      </div>
    );
  };

  const ProgressBar = ({ percent, color }) => (
    <div style={{ width: '100%', background: '#E2E8F0', borderRadius: '6px', height: '10px', marginTop: '12px', overflow: 'hidden' }}>
      <div style={{ width: `${percent}%`, background: color, height: '100%', borderRadius: '6px', transition: 'width 0.8s ease-out' }}></div>
    </div>
  );

  const departmentData = {
    'Backend': { icon: <Database size={32} color="#166534"/>, color: '#166534', bg: '#DCFCE7', desc: 'Server infrastructure, database management.', metrics: [{l: 'API Uptime', v: '99.98%'}, {l: 'Avg Latency', v: '42ms'}] },
    'Frontend': { icon: <Code2 size={32} color="#1E40AF"/>, color: '#1E40AF', bg: '#DBEAFE', desc: 'User interface, client-side logic.', metrics: [{l: 'Lighthouse Score', v: '96/100'}, {l: 'Render Time', v: '0.8s'}] },
    'QA': { icon: <ShieldCheck size={32} color="#92400E"/>, color: '#92400E', bg: '#FEF3C7', desc: 'Quality assurance, automated testing.', metrics: [{l: 'Test Coverage', v: '88%'}, {l: 'Failed Pipelines', v: '0'}] },
    'Documentation': { icon: <BookOpen size={32} color="#6B21A8"/>, color: '#6B21A8', bg: '#F3E8FF', desc: 'Technical writing, API references.', metrics: [{l: 'Docs Published', v: '145'}, {l: 'Readability', v: 'A+'}] }
  };

  const upcomingProjects = [
    { name: 'Q4 Product Redesign', start: 'Nov 01', phase: 'Design', progress: 35, color: '#F59E0B', bg: '#FEF3C7' },
    { name: 'Payment Gateway', start: 'Nov 15', phase: 'Development', progress: 65, color: '#3B82F6', bg: '#DBEAFE' },
    { name: 'Mobile App V2.0', start: 'Dec 05', phase: 'Research', progress: 10, color: '#8B5CF6', bg: '#F3E8FF' }
  ];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: theme.bg, color: theme.text, fontFamily: '"Inter", "Segoe UI", sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .page-transition { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .primary-nav-icon:hover { background: rgba(255,255,255,0.08) !important; transform: scale(1.05); }
        .secondary-nav-item:hover { background: #F1F5F9 !important; transform: translateX(2px); }
        .secondary-nav-item:active { transform: scale(0.98); }
        input:focus, select:focus { border-color: ${theme.accent} !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
      `}</style>

      {/* Primary Sidebar */}
      <aside style={{ width: '80px', background: theme.primarySidebar, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', zIndex: 30, flexShrink: 0, boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: '12px', marginBottom: '32px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'900', fontSize:'18px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'}}>KB</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
          <PrimaryIcon id="Home" Icon={LayoutDashboard} label="Dashboard" />
          <PrimaryIcon id="Dashboard" Icon={Kanban} label="Kanban Board" />
          <PrimaryIcon id="Projects" Icon={Folder} label="Projects" />
          <PrimaryIcon id="AIAssistant" Icon={Sparkles} label="AI Assistant ✨" />
          <PrimaryIcon id="Reports" Icon={BarChart2} label="Reports" />
          <PrimaryIcon id="Notifications" Icon={Bell} label="Notifications" />
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div title={`${user.username} (${user.email})`} style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.color || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', border: '2px solid #475569' }}>
            {getInitials(user.username)}
          </div>
        </div>
      </aside>

      {/* Secondary Sidebar */}
      {activePrimaryTab === 'Dashboard' && (
        <aside className="page-transition" style={{ width: '280px', background: theme.secondarySidebar, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${theme.border}`, zIndex: 20, flexShrink: 0, height: '100vh' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}` }}>
            <div className="hover-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px', borderRadius: '10px', background: '#F8FAFC', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1E293B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}><Layers size={18} /></div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', lineHeight: '1.2' }}>Kanban Board</div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Team Workspace</div>
                </div>
              </div>
              <ChevronDown size={18} color="#94A3B8" />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '12px', background: '#F1F5F9', border: `1px dashed #CBD5E1`, borderRadius: '8px', color: '#334155', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', transition: '0.2s' }} onClick={() => document.getElementById('task-input').focus()}><Plus size={18} /> Create New Task</button>
            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', color: '#94A3B8', paddingLeft: '8px', letterSpacing:'0.5px' }}>PROJECT PIPELINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
              <SidebarItem icon={<Folder size={18} />} label="Active Projects" count={cards.filter(c => c.status !== 'Done').length} />
              <SidebarItem icon={<FolderCheck size={18} />} label="Completed Projects" count={cards.filter(c => c.status === 'Done').length} />
            </div>
            <div style={{ marginTop: '32px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', color: '#94A3B8', paddingLeft: '8px', letterSpacing:'0.5px' }}>DEPARTMENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                <SidebarItem icon={<Tag size={18} />} iconColor="#16A34A" label="Backend" count={cards.filter(c => c.tag === 'Backend').length} />
                <SidebarItem icon={<Tag size={18} />} iconColor="#2563EB" label="Frontend" count={cards.filter(c => c.tag === 'Frontend').length} />
                <SidebarItem icon={<Tag size={18} />} iconColor="#D97706" label="QA" count={cards.filter(c => c.tag === 'QA').length} />
                <SidebarItem icon={<BookOpen size={18} />} iconColor="#6B21A8" label="Documentation" count={cards.filter(c => c.tag === 'Documentation').length} />
              </div>
            </div>
            <div style={{ marginTop: '32px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', color: '#94A3B8', paddingLeft: '8px', letterSpacing:'0.5px' }}>VIEWS & REPORTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                <SidebarItem icon={<Users size={18} />} label="Team Overview" count={teamMembers.length} />
              </div>
            </div>
          </div>
        </aside>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* KANBAN BOARD */}
        {activePrimaryTab === 'Dashboard' && activeSidebarItem === 'Active Projects' && (
          <div className="page-transition" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
            <header style={{ background: '#fff', padding: '32px 40px', borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>Kanban Board</h1>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: theme.sidebarText }}>Real-time secure collaborative task execution.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '12px 16px 12px 42px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: '#F8FAFC', fontSize: '14px', outline: 'none', width: '240px' }} />
                  </div>
                  <button className="btn-primary" onClick={loadDemoSprint} style={{ padding: '12px 20px', background: '#F1F5F9', color: '#334155', border: `1px solid ${theme.border}`, borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display:'flex', gap:'8px', alignItems:'center' }}><Activity size={18}/> Load Tasks</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <input id="task-input" type="text" placeholder="✨ What feature are we building next?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} style={{ padding: '12px 16px', flex: 1, borderRadius: '8px', border: `1px solid #CBD5E1`, outline: 'none', fontSize: '15px' }} />
                <select value={newTaskTag} onChange={(e) => setNewTaskTag(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid #CBD5E1`, outline: 'none', cursor: 'pointer', fontWeight: '600' }}><option>Backend</option><option>Frontend</option><option>QA</option><option>Documentation</option></select>
                <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid #CBD5E1`, outline: 'none', cursor: 'pointer', fontWeight: '600' }}><option>High</option><option>Medium</option><option>Low</option></select>
                <button className="btn-primary" onClick={handleAddTask} style={{ padding: '0 28px', background: theme.accent, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18}/> Add Task</button>
              </div>
            </header>

            <div style={{ flex: 1, padding: '32px 40px', overflowX: 'auto', display: 'flex', gap: '24px', background: '#F8FAFC' }}>
              <DragDropContext onDragEnd={onDragEnd}>
                {columns.map(status => {
                  const columnCards = cards.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) && c.status === status);
                  return (
                    <Droppable key={status} droppableId={status}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} style={{ flex: 1, minWidth: '320px', background: snapshot.isDraggingOver ? '#E2E8F0' : '#F1F5F9', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', border: `1px solid ${theme.border}`, transition: 'background 0.2s' }}>
                          <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', color: '#1E293B', borderBottom: '2px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{status}</div>
                            <span style={{ background: '#E2E8F0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>{columnCards.length}</span>
                          </div>
                          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {columnCards.map((card, index) => {
                              const tColor = getTagColor(card.tag);
                              return (
                                <Draggable key={card.id} draggableId={card.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => handleOpenTask(card)} className="hover-card"
                                      style={{ background: '#fff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #E2E8F0', borderLeft: `6px solid ${getPriorityBorderColor(card.priority)}`, boxShadow: snapshot.isDragging ? '0 15px 20px -5px rgba(0,0,0,0.15)' : '0 2px 4px 0 rgba(0,0,0,0.02)', ...provided.draggableProps.style }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: theme.sidebarText }}>{card.taskId}</span>
                                        <X size={16} color="#CBD5E1" onClick={(e)=>handleDeleteTask(card.id, e)} style={{cursor:'pointer'}} />
                                      </div>
                                      <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A', lineHeight: '1.4' }}>{card.title}</h4>
                                      <div style={{ display:'inline-block', background: tColor.bg, color: tColor.c, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', marginBottom: '16px' }}>{card.tag}</div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                        <div style={{ display: 'flex', gap: '16px', color: '#94A3B8', fontSize: '13px', fontWeight: '600' }}><span style={{display:'flex', alignItems:'center', gap:'6px'}}><CalendarIcon size={16}/> {card.dueDate}</span></div>
                                        <div title={`Assigned to: ${card.assigneeName || 'Unknown'} (${card.assigneeEmail || 'No Email'})`} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', border: '1px solid #BFDBFE', cursor: 'help' }}>{card.assignee}</div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </DragDropContext>
            </div>
          </div>
        )}

        {/* COMPLETED PROJECTS VIEW */}
        {activePrimaryTab === 'Dashboard' && activeSidebarItem === 'Completed Projects' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FolderCheck size={32} color="#16A34A" /> Completed Projects
            </h1>
            <p style={{ color: theme.sidebarText, marginBottom: '32px', fontSize: '16px' }}>All successfully delivered tasks and features.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {cards.filter(c => c.status === 'Done').map(card => (
                 <div key={card.id} className="hover-card" onClick={() => handleOpenTask(card)} style={{ cursor: 'pointer', background: '#F0FDF4', padding: '24px', borderRadius: '16px', border: `1px solid #22C55E`, borderTop: `8px solid #16A34A` }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                     <span style={{ fontSize: '13px', color: '#166534', fontWeight: '800' }}>{card.taskId}</span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}><CheckCircle2 size={14}/> {card.status}</span>
                   </div>
                   <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#14532D', lineHeight: '1.4' }}>{card.title}</h4>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid #BBF7D0`, paddingTop: '16px', fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                     <span>{card.tag}</span>
                     <span>Done by: {card.assignee}</span>
                   </div>
                 </div>
              ))}
              {cards.filter(c => c.status === 'Done').length === 0 && (
                 <div style={{ color: theme.sidebarText, fontSize: '16px', padding: '24px', background: '#fff', borderRadius: '12px', border: `1px dashed ${theme.border}`, gridColumn: 'span 3', textAlign: 'center' }}>No tasks have been completed yet. Move a task to "Done" to see it here!</div>
              )}
            </div>
          </div>
        )}

        {/* DEPARTMENT OVERVIEWS */}
        {activePrimaryTab === 'Dashboard' && ['Backend', 'Frontend', 'QA', 'Documentation'].includes(activeSidebarItem) && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            {(() => {
              const dept = departmentData[activeSidebarItem];
              const deptCards = cards.filter(c => c.tag === activeSidebarItem);
              return (
                <div>
                  <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '10px' }}>{activeSidebarItem} Department</h1>
                  <p style={{ color: theme.sidebarText, marginBottom: '32px', fontSize: '16px' }}>{dept.desc}</p>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '48px' }}>
                     {dept.metrics.map((m, i) => (
                       <div key={i} className="hover-card" style={{ background: '#fff', padding: '24px 32px', borderRadius: '16px', border: `1px solid ${theme.border}`, flex: 1 }}>
                         <div style={{ color: theme.sidebarText, fontSize: '13px', textTransform: 'uppercase', fontWeight: '800', letterSpacing:'1px', marginBottom: '8px' }}>{m.l}</div>
                         <div style={{ fontSize: '36px', fontWeight: '900', color: dept.color }}>{m.v}</div>
                       </div>
                     ))}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', borderBottom: `2px solid ${theme.border}`, paddingBottom: '16px' }}>Live Task Pipeline</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                     {deptCards.map(card => (
                       <div key={card.id} className="hover-card" onClick={() => handleOpenTask(card)} style={{ cursor: 'pointer', background: '#fff', padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, borderTop: `8px solid ${dept.color}` }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                           <span style={{ fontSize: '13px', color: theme.sidebarText, fontWeight: '800' }}>{card.taskId}</span>
                           <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>{card.status}</span>
                         </div>
                         <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0F172A', lineHeight: '1.4' }}>{card.title}</h4>
                         <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.border}`, paddingTop: '16px', fontSize: '13px', color: theme.sidebarText, fontWeight: '600' }}>
                           <span>Priority: <span style={{ color: getPriorityBorderColor(card.priority) }}>{card.priority}</span></span>
                           <span>Due: {card.dueDate}</span>
                         </div>
                       </div>
                     ))}
                     {deptCards.length === 0 && <div style={{ color: theme.sidebarText, fontSize: '16px', padding: '24px', background: '#fff', borderRadius: '12px', border: `1px dashed ${theme.border}` }}>No active tasks assigned to {activeSidebarItem} yet.</div>}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* TEAM OVERVIEW */}
        {activePrimaryTab === 'Dashboard' && activeSidebarItem === 'Team Overview' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div><h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Team Directory 👥</h1><p style={{ color: theme.sidebarText, marginTop: '6px', fontSize: '15px' }}>Live active members globally synced.</p></div>
              <button onClick={handleCopyLink} className="btn-primary" style={{ padding: '12px 24px', background: '#F1F5F9', color: '#0F172A', border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Link size={18} /> Copy Invite Link</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {teamMembers.map((m, i) => {
                const initials = getInitials(m.name);
                const memberTasksCount = cards.filter(c => c.assigneeEmail === m.email && c.status !== 'Done').length;
                return (
                  <div key={i} className="hover-card" style={{ background: '#fff', padding: '32px 24px', borderRadius: '16px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '4px 10px', background: '#D1FAE5', color: '#065F46', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '16px' }}>{m.status || 'Online 🟢'}</div>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: m.color || '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', margin: '0 auto 16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{initials}</div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{m.name}</h3>
                    <div style={{ fontSize: '13px', color: theme.accent, fontWeight: '600', marginBottom: '4px' }}>{m.email}</div>
                    <div style={{ fontSize: '14px', color: theme.sidebarText, marginBottom: '20px', fontWeight: '500' }}>{m.role}</div>
                    <div style={{ background: '#F8FAFC', border: `1px solid ${theme.border}`, padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.sidebarText }}>Active Workload:</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: theme.accent }}>{memberTasksCount} tasks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOME DASHBOARD */}
        {activePrimaryTab === 'Home' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
               <div><h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 8px 0' }}>Welcome back, {user.username}! ✨</h1><p style={{ color: theme.sidebarText, margin: 0, fontSize: '16px' }}>Live workspace dashboard and team overview.</p></div>
               <button className="btn-primary" onClick={() => setActivePrimaryTab('Dashboard')} style={{ padding: '12px 24px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>Go to Board <ArrowRight size={18}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
              <div className="hover-card" style={{ background: '#EFF6FF', padding: '28px', borderRadius: '16px', color: '#1D4ED8', border: '1px solid #BFDBFE' }}><h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700' }}>Total Pipeline Tasks</h3><div style={{ fontSize: '56px', fontWeight: '900' }}>{cards.length}</div></div>
              <div className="hover-card" style={{ background: '#F3E8FF', padding: '28px', borderRadius: '16px', color: '#7E22CE', border: '1px solid #E9D5FF' }}><h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700' }}>Currently In Progress</h3><div style={{ fontSize: '56px', fontWeight: '900' }}>{cards.filter(c => c.status === 'In Progress').length}</div></div>
              <div className="hover-card" style={{ background: '#FEF2F2', padding: '28px', borderRadius: '16px', color: '#B91C1C', border: '1px solid #FECACA' }}><h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700' }}>High Priority (Urgent)</h3><div style={{ fontSize: '56px', fontWeight: '900' }}>{cards.filter(c => c.priority === 'High').length}</div></div>
              <div className="hover-card" style={{ background: '#F0FDF4', padding: '28px', borderRadius: '16px', color: '#15803D', border: '1px solid #BBF7D0' }}><h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700' }}>Successfully Completed</h3><div style={{ fontSize: '56px', fontWeight: '900' }}>{cards.filter(c => c.status === 'Done').length}</div></div>
            </div>
            <div style={{ display: 'flex', gap: '40px' }}>
               <div style={{ flex: 2 }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0F172A' }}><Activity size={22} color={theme.accent}/> Live Activity</h3>
                  <div style={{ borderLeft: `3px solid #E2E8F0`, paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '32px', marginLeft: '12px' }}>
                    {[{ action: `Secure workspace accessed by ${user.username}`, user: user.email, time: 'Now', color: '#10B981' }, { action: 'Real-time WebSocket connection established', user: 'System Server', time: 'Active', color: '#3B82F6' }].map((act, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-37px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: act.color, border: '4px solid #fff' }}></div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>{act.action}</div>
                        <div style={{ fontSize: '14px', color: theme.sidebarText, fontWeight: '500' }}>{act.user} • {act.time}</div>
                      </div>
                    ))}
                  </div>
               </div>
               <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0F172A' }}><ShieldCheck size={22} color="#10B981"/> System Health</h3>
                  <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '15px' }}><span style={{fontWeight:'700'}}>API Services</span> <span style={{color:'#10B981', fontWeight:'800'}}>100% Online</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '15px' }}><span style={{fontWeight:'700'}}>WebSocket Node</span> <span style={{color:'#10B981', fontWeight:'800'}}>Secure (JWT)</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}><span style={{fontWeight:'700'}}>Connected Members</span> <span style={{color:'#3B82F6', fontWeight:'800'}}>{teamMembers.length} active</span></div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PROJECTS PORTFOLIO */}
        {activePrimaryTab === 'Projects' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: theme.text, fontWeight: '800' }}>Projects Portfolio 📂</h1>
            <p style={{ margin: '0 0 40px', color: theme.sidebarText, fontSize: '16px' }}>Manage all your active, upcoming, and completed projects.</p>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Upcoming Projects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
              {upcomingProjects.map((proj, idx) => (
                <div key={idx} className="hover-card" style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ padding: '6px 12px', background: proj.bg, color: proj.color, borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{proj.phase}</span>
                      <div style={{ fontSize: '14px', color: theme.sidebarText }}><Clock size={16}/> Starts {proj.start}</div>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700' }}>{proj.name}</h3>
                  </div>
                  <ProgressBar percent={proj.progress} color={proj.color} />
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#166534' }}>Completed Projects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              {cards.filter(c => c.status === 'Done').map(card => (
                <div key={card.id} style={{ background: '#F0FDF4', padding: '24px', borderRadius: '12px', border: '1px solid #22C55E' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '700', color: '#14532D' }}>{card.title}</h3>
                  <div style={{ fontSize: '12px', color: '#15803D', fontWeight: '600' }}>Finished Successfully</div>
                </div>
              ))}
              {cards.filter(c => c.status === 'Done').length === 0 && <div style={{color: '#15803D'}}>No completed tasks yet.</div>}
            </div>
          </div>
        )}

        {/* 🔥 REAL INTERACTIVE AI ASSISTANT TAB 🔥 */}
        {activePrimaryTab === 'AIAssistant' && (
          <div className="page-transition" style={{ flex: 1, padding: '40px 60px', overflowY: 'auto', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '950px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px', color: '#0F172A' }}>
                  <Sparkles size={32} color={theme.accent} /> Workspace AI Copilot
                </h1>
                <p style={{ color: theme.sidebarText, margin: 0, fontSize: '15px' }}>Live Agile intelligence aware of all {cards.length} tasks on your board.</p>
              </div>

              {/* Quick Action Chips */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  'Generate Daily Standup Report',
                  'Analyze Board Bottlenecks',
                  'List all High Priority Tasks',
                  'Suggest QA Test Cases for Tasks'
                ].map((actionTitle) => (
                  <button
                    key={actionTitle}
                    onClick={() => triggerAIAssistantQuery(actionTitle)}
                    disabled={isAssistantThinking}
                    style={{ background: '#fff', border: '1.5px solid #CBD5E1', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    className="hover-card"
                  >
                    <Sparkles size={14} color={theme.accent} /> {actionTitle}
                  </button>
                ))}
              </div>

              {/* Live Chat History Window */}
              <div style={{ flex: 1, minHeight: '380px', maxHeight: '520px', overflowY: 'auto', background: '#fff', borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {aiChatMessages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '16px 20px', borderRadius: '14px', background: msg.sender === 'user' ? theme.accent : '#F8FAFC', color: msg.sender === 'user' ? '#fff' : '#1E293B', border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {msg.sender === 'ai' && <div style={{ fontSize: '11px', fontWeight: '800', color: theme.accent, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={13}/> AI Assistant</div>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAssistantThinking && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '14px 20px', borderRadius: '14px', background: '#EFF6FF', color: theme.accent, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700' }}>
                      <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Analyzing workspace board and generating response...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color={theme.sidebarText} style={{ marginLeft: '8px' }} />
                <input 
                  type="text" 
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && triggerAIAssistantQuery()}
                  placeholder="Ask anything about your sprint, architecture, or write standup notes..." 
                  style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '15px', background: 'transparent' }} 
                />
                <button 
                  onClick={() => triggerAIAssistantQuery()} 
                  disabled={isAssistantThinking || !aiCommand.trim()}
                  style={{ background: theme.accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: isAssistantThinking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={16} /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS & ANALYTICS */}
        {activePrimaryTab === 'Reports' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '20px' }}>Sprint Analytics 📊</h1>
            <p style={{ color: theme.sidebarText, marginBottom: '40px', fontSize: '16px' }}>Real breakdown of team velocity and task distribution.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
               <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Task Priority Distribution</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '150px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
                     <div style={{ flex: 1, background: '#EF4444', height: `${(cards.filter(c => c.priority === 'High').length / (cards.length || 1)) * 100}%`, borderRadius: '4px 4px 0 0' }}></div>
                     <div style={{ flex: 1, background: '#F59E0B', height: `${(cards.filter(c => c.priority === 'Medium').length / (cards.length || 1)) * 100}%`, borderRadius: '4px 4px 0 0' }}></div>
                     <div style={{ flex: 1, background: '#3B82F6', height: `${(cards.filter(c => c.priority === 'Low').length / (cards.length || 1)) * 100}%`, borderRadius: '4px 4px 0 0' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.sidebarText }}>
                     <div style={{ flex: 1 }}>High</div><div style={{ flex: 1 }}>Medium</div><div style={{ flex: 1 }}>Low</div>
                  </div>
               </div>
               <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Weekly Velocity</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '150px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
                     {[40, 60, 45, 80, 50].map((h, i) => (
                       <div key={i} style={{ flex: 1, background: theme.accent, height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: i === 4 ? 1 : 0.6 }}></div>
                     ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.sidebarText }}>
                     <div style={{ flex: 1 }}>Mon</div><div style={{ flex: 1 }}>Tue</div><div style={{ flex: 1 }}>Wed</div><div style={{ flex: 1 }}>Thu</div><div style={{ flex: 1 }}>Fri</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activePrimaryTab === 'Notifications' && (
          <div className="page-transition" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: theme.bg }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '24px' }}>Inbox & Live Alerts 🔔</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
               {notificationsList.map((notif, i) => (
                 <div key={i} className="hover-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: notif.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{notif.icon}</div>
                    <div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}><h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{notif.title}</h4><span style={{ fontSize: '12px', color: theme.sidebarText, fontWeight: '600' }}>{notif.time}</span></div><div style={{ fontSize: '14px', color: theme.sidebarText }}>{notif.desc}</div></div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TASK DETAIL & AI BREAKDOWN */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeInUp 0.2s' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '700px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: theme.accent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedTask.taskId} • {selectedTask.tag}</div>
                <h3 style={{ margin: '12px 0 0', fontSize: '28px', fontWeight: '900', color: '#0F172A' }}>{selectedTask.title}</h3>
                <div style={{ fontSize: '13px', color: theme.sidebarText, marginTop: '8px' }}>Created by: <span style={{ fontWeight: '600' }}>{selectedTask.assigneeName || 'Member'} ({selectedTask.assigneeEmail || 'N/A'})</span></div>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '50%', transition: '0.2s' }}><X size={24} color="#475569"/></button>
            </div>
            
            <textarea value={selectedTask.description || ''} onChange={(e) => handleUpdateTaskDescription(e.target.value)} placeholder="Add a detailed description..." style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '12px', border: '2px solid #E2E8F0', outline: 'none', fontSize: '15px', resize: 'none', fontFamily: 'inherit' }} />

            {isAiLoading && (<div style={{ padding: '20px', background: '#EFF6FF', borderRadius: '12px', color: theme.accent, display: 'flex', gap: '12px', alignItems: 'center', fontWeight: '700', fontSize: '15px' }}><Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}/> Generating expert AI subtasks via Google Gemini...</div>)}
            {!isAiLoading && aiOutput && (<div style={{ padding: '20px', background: '#FEF2F2', borderLeft: `6px solid #EF4444`, borderRadius: '12px', color: '#B91C1C', fontWeight: '600' }}>{aiOutput}</div>)}
            
            {!isAiLoading && aiPreview && (
              <div style={{ padding: '24px', background: '#F8FAFC', borderLeft: `6px solid ${theme.accent}`, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: theme.accent, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', letterSpacing: '0.5px' }}><Sparkles size={16} /> AI Suggested Breakdown</span>
                <pre style={{ margin: '0 0 24px 0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '15px', color: '#334155', lineHeight: '1.6', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>{aiPreview}</pre>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleAcceptAIPreview} style={{ flex: 1, padding: '12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>✅ Accept & Save </button>
                  <button onClick={() => setAiPreview(null)} style={{ flex: 1, padding: '12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>❌ Discard</button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
              <button className="btn-primary" onClick={(e) => generateAISubtasks(selectedTask.title, e)} disabled={isAiLoading} style={{ padding: '14px 28px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', display: 'flex', gap: '10px', alignItems: 'center', transition: '0.2s' }}><Sparkles size={20}/> {isAiLoading ? 'Analyzing Task...' : 'Generate AI Breakdown'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}