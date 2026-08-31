// AI_Projects/dashboard/src/App.jsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip as MuiTooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TerminalIcon from '@mui/icons-material/Terminal';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';
import './App.css';

const ACCENT_COLORS = ['#00E5FF', '#7C4DFF', '#FF4081', '#00E676', '#FFD600', '#FF6D00'];

export default function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Feed, 1: AI Chat Assistant

  // RAG Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am EyeKeeper.AI. Ask me anything about your tracked activity, productivity patterns, or window usage history!' }
  ]);

  const fetchData = async () => {
    try {
      const logsRes = await axios.get('http://localhost:5000/api/logs');
      const statsRes = await axios.get('http://localhost:5000/api/stats');
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error connecting to backend:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // RAG Query Handler
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userQuery = chatInput;
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Connects to your Express / Python RAG route
      const response = await axios.post('http://localhost:5000/api/ask', { question: userQuery });
      setMessages((prev) => [...prev, { sender: 'ai', text: response.data.answer || response.data.response || 'No specific activity records found for this query.' }]);
    } catch (err) {
      console.error('RAG Query Error:', err);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error connecting to RAG backend service. Please check your backend server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalTimeSeconds = stats.reduce((acc, curr) => acc + (curr.total_duration || 0), 0);
  const primaryCategory = stats.length > 0 ? [...stats].sort((a, b) => b.total_duration - a.total_duration)[0]?.category : 'N/A';

  return (
    <Box className="dashboard-container">
      {/* Top Header Bar */}
      <Paper component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel dashboard-header">
        <Box className="header-title-box">
          <Box className="header-icon-badge">
            <TerminalIcon sx={{ fontSize: 24 }} />
          </Box>
          <Typography className="header-title">
            EyeKeeper.AI
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box className="status-indicator">
            <Box className="status-dot" />
            LIVE MONITORING
          </Box>
          <MuiTooltip title="Sync Dashboard">
            <IconButton onClick={fetchData} sx={{ color: '#00E5FF', '&:hover': { transform: 'rotate(180deg)', transition: '0.4s' } }}>
              <RefreshIcon />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Paper>

      {/* KPI Cards Row */}
      <Box className="kpi-row">
        <Paper component={motion.div} whileHover={{ y: -3 }} className="glass-panel kpi-card kpi-card-cyan">
          <Box>
            <Typography className="kpi-label">Total Tracked Duration</Typography>
            <Typography className="kpi-value">
              {Math.floor(totalTimeSeconds / 60)} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>mins</span>
            </Typography>
          </Box>
          <Box className="kpi-icon-wrapper" sx={{ color: '#00E5FF' }}>
            <AccessTimeIcon />
          </Box>
        </Paper>

        <Paper component={motion.div} whileHover={{ y: -3 }} className="glass-panel kpi-card kpi-card-purple">
          <Box>
            <Typography className="kpi-label">Recorded Events</Typography>
            <Typography className="kpi-value">{logs.length}</Typography>
          </Box>
          <Box className="kpi-icon-wrapper" sx={{ color: '#7C4DFF' }}>
            <QueryStatsIcon />
          </Box>
        </Paper>

        <Paper component={motion.div} whileHover={{ y: -3 }} className="glass-panel kpi-card kpi-card-pink">
          <Box>
            <Typography className="kpi-label">Top Activity Focus</Typography>
            <Typography className="kpi-value" sx={{ color: '#00E5FF !important' }}>{primaryCategory}</Typography>
          </Box>
          <Box className="kpi-icon-wrapper" sx={{ color: '#FF4081' }}>
            <MemoryIcon />
          </Box>
        </Paper>
      </Box>

      {/* Main Grid */}
      <Box className="dashboard-grid">
        {/* Left Side: Charts */}
        <Box className="charts-pane">
          <Paper className="glass-panel chart-panel">
            <Box className="panel-header">
              <Typography className="panel-title">Category Share</Typography>
              <Chip label="Ratio" size="small" sx={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00E5FF', fontWeight: 700, fontSize: '0.65rem' }} />
            </Box>
            <Box className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats}
                    dataKey="total_duration"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACCENT_COLORS[index % ACCENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D131F', borderColor: '#00E5FF', borderRadius: '8px', color: '#FFF' }}
                    formatter={(val) => `${Math.floor(val / 60)} mins`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper className="glass-panel chart-panel">
            <Box className="panel-header">
              <Typography className="panel-title">Time Spent per Category (Seconds)</Typography>
              <Chip label="Analytics" size="small" sx={{ background: 'rgba(124, 77, 255, 0.1)', color: '#7C4DFF', fontWeight: 700, fontSize: '0.65rem' }} />
            </Box>
            <Box className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D131F', borderColor: '#7C4DFF', borderRadius: '8px', color: '#FFF' }}
                  />
                  <Bar dataKey="total_duration" fill="#7C4DFF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>

        {/* Right Side: Tabbed Panel (Real-Time Feed OR RAG Chat Assistant) */}
        <Paper className="glass-panel feed-pane">
          <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#0D131F' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newVal) => setActiveTab(newVal)}
              textColor="inherit"
              TabIndicatorProps={{ style: { backgroundColor: '#00E5FF' } }}
            >
              <Tab icon={<ListAltIcon sx={{ fontSize: 18 }} />} label="Real-Time Feed" sx={{ color: '#8F9BBA', fontSize: '0.75rem', fontWeight: 700, minHeight: 48 }} />
              <Tab icon={<SmartToyIcon sx={{ fontSize: 18 }} />} label="Ask EyeKeeper AI (RAG)" sx={{ color: '#8F9BBA', fontSize: '0.75rem', fontWeight: 700, minHeight: 48 }} />
            </Tabs>
          </Box>

          {/* TAB 0: Real-time Feed Table */}
          {activeTab === 0 && (
            <TableContainer className="table-scroll-wrapper">
              <Table stickyHeader size="small">
                <TableHead className="custom-table-head">
                  <TableRow>
                    {['Timestamp', 'Category', 'App Name', 'Summary', 'Duration'].map((col, idx) => (
                      <TableCell key={idx} className="custom-head-cell">
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: '#64748B', py: 6 }}>
                        No activity events registered today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((row) => (
                      <TableRow key={row.id} className="custom-row">
                        <TableCell className="custom-cell">{row.readable_time || row.timestamp}</TableCell>
                        <TableCell className="custom-cell">
                          <Chip
                            label={row.category}
                            size="small"
                            className="chip-tag"
                            sx={{
                              backgroundColor: row.category === 'Coding' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(124, 77, 255, 0.15)',
                              color: row.category === 'Coding' ? '#00E5FF' : '#B388FF',
                              border: `1px solid ${row.category === 'Coding' ? 'rgba(0,229,255,0.3)' : 'rgba(124,77,255,0.3)'}`
                            }}
                          />
                        </TableCell>
                        <TableCell className="custom-cell app-badge">{row.app_name}</TableCell>
                        <TableCell className="custom-cell" sx={{ color: '#94A3B8 !important' }}>{row.summary}</TableCell>
                        <TableCell className="custom-cell" sx={{ fontWeight: 700 }}>{row.duration_seconds || 0}s</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 1: RAG Chat Assistant */}
          {activeTab === 1 && (
            <Box className="chat-container">
              <Box className="chat-messages-box">
                {messages.map((msg, index) => (
                  <Box key={index} className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                    {msg.text}
                  </Box>
                ))}
                {chatLoading && (
                  <Box className="chat-bubble chat-bubble-ai" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: '#00E5FF' }} />
                    <Typography variant="caption">Searching activity knowledge base...</Typography>
                  </Box>
                )}
              </Box>

              <Box className="chat-input-box">
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder="Ask e.g. 'How much time did I spend on VS Code today?'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton className="chat-send-btn" size="small" onClick={handleSendMessage} disabled={chatLoading}>
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}