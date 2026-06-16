import { useState, useEffect, useRef } from 'react'
import {
  Users,
  LayoutDashboard,
  Building,
  Settings,
  ShieldCheck,
  Search,
  Bell,
  ChevronRight,
  Activity,
  BrainCircuit,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Clock,
  ExternalLink,
  Plus,
  Cpu,
  Sparkles,
  PieChart,
  Database,
  Calendar,
  AlertTriangle,
  Zap,
  Globe,
  HardDrive,
  FileText,
  BarChart3,
  Bot,
  Layers,
  Terminal,
  Shield,
  ClipboardList,
  Target,
  Mic,
  Play,
  CheckCircle,
  Trash2,
  UserCheck,
  Compass
} from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const BACKEND_URL = 'http://localhost:3001'

function App() {
  // ─── AUTHENTICATION STATE ──────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'))
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('admin_user') || 'null'))
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // ─── NAVIGATION STATE ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard is Executive Command Center, overview is Overview Dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ─── SYSTEM/BUSINESS DATA STATE ───────────────────────────────────────────
  const [stats, setStats] = useState<any>({
    users: 0,
    workspaces: 0,
    projects: 0,
    messages: 0,
    tasks: 0,
    agents: 0,
    auditLogs: 0,
    uptime: "99.9%",
    storage: "0GB",
    healthScore: 88
  })
  const [usersList, setUsersList] = useState<any[]>([])
  const [workspacesList, setWorkspacesList] = useState<any[]>([])
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [tasksList, setTasksList] = useState<any[]>([])
  const [activitiesList, setActivitiesList] = useState<any[]>([])
  const [invitationsList, setInvitationsList] = useState<any[]>([])
  const [notificationsList, setNotificationsList] = useState<any[]>([])
  const [agentsList, setAgentsList] = useState<any[]>([])
  const [documentsList, setDocumentsList] = useState<any[]>([])
  const [workflowsList, setWorkflowsList] = useState<any[]>([])
  const [marketplaceList, setMarketplaceList] = useState<any[]>([])
  const [meetingsList, setMeetingsList] = useState<any[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ─── NOTIFICATION DROPDOWN STATE ──────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false)

  // ─── DIALOGS & CREATION FORM STATES ───────────────────────────────────────
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteMsg, setInviteMsg] = useState('')

  const [onboardModalOpen, setOnboardModalOpen] = useState(false)
  const [onboardName, setOnboardName] = useState('')
  const [onboardUsername, setOnboardUsername] = useState('')
  const [onboardEmail, setOnboardEmail] = useState('')
  const [onboardPassword, setOnboardPassword] = useState('')
  const [onboardRole, setOnboardRole] = useState('Operator')

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectIndustry, setProjectIndustry] = useState('AI / ML Tools')
  const [projectTarget, setProjectTarget] = useState('')

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('founder')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskStatus, setTaskStatus] = useState('todo')
  const [taskDueDate, setTaskDueDate] = useState('')

  const [docModalOpen, setDocModalOpen] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState('SOP')
  const [docContent, setDocContent] = useState('')

  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [wfName, setWfName] = useState('')
  const [wfTrigger, setWfTrigger] = useState('New Project')
  const [wfSteps, setWfSteps] = useState<string[]>([])
  const [wfNewStep, setWfNewStep] = useState('')

  // ─── TUNING AGENT STATE ────────────────────────────────────────────────────
  const [tuningAgent, setTuningAgent] = useState<any>(null)
  const [agentModel, setAgentModel] = useState('')
  const [agentTemp, setAgentTemp] = useState(0.7)
  const [agentPrompt, setAgentPrompt] = useState('')

  // ─── CHAT STATE ────────────────────────────────────────────────────────────
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentionsDropdown, setShowMentionsDropdown] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // ─── MEMORY & MEETING ENGINE STATES ────────────────────────────────────────
  const [memoryQuery, setMemoryQuery] = useState('')
  const [memoryAnswer, setMemoryAnswer] = useState<string | null>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)

  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [selectedMeetingAgents, setSelectedMeetingAgents] = useState<string[]>(['founder', 'ceo'])
  const [meetingLoading, setMeetingLoading] = useState(false)
  const [activeMeetingDetails, setActiveMeetingDetails] = useState<any>(null)

  // ─── VOICE STATE ───────────────────────────────────────────────────────────
  const [voiceRecording, setVoiceRecording] = useState(false)

  // ─── SECURITY SETTING STATES ──────────────────────────────────────────────
  const [secPassword, setSecPassword] = useState('')
  const [sec2FA, setSec2FA] = useState(false)

  // ─── FILTER / SEARCH STRINGS ──────────────────────────────────────────────
  const [userQuery, setUserQuery] = useState('')
  const [auditQuery, setAuditQuery] = useState('')
  const [docQuery, setDocQuery] = useState('')

  // ─── INITIAL FETCH ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchCoreData()
      const interval = setInterval(fetchCoreData, 30000) // Poll stats every 30s
      return () => clearInterval(interval)
    }
  }, [token])

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCoreData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }

      const [statsRes, usersRes, wsRes, projRes, taskRes, actRes, inviteRes, noteRes, agentRes, docRes, wfRes, marketRes, meetingsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/stats`, config),
        axios.get(`${BACKEND_URL}/api/admin/users`, config),
        axios.get(`${BACKEND_URL}/api/admin/workspaces`, config),
        axios.get(`${BACKEND_URL}/api/admin/projects`, config),
        axios.get(`${BACKEND_URL}/api/admin/tasks`, config),
        axios.get(`${BACKEND_URL}/api/admin/activities`, config),
        axios.get(`${BACKEND_URL}/api/admin/invitations`, config),
        axios.get(`${BACKEND_URL}/api/admin/notifications`, config),
        axios.get(`${BACKEND_URL}/api/admin/agents`, config),
        axios.get(`${BACKEND_URL}/api/admin/documents`, config),
        axios.get(`${BACKEND_URL}/api/admin/automations`, config),
        axios.get(`${BACKEND_URL}/api/admin/marketplace`, config),
        axios.get(`${BACKEND_URL}/api/admin/meetings`, config)
      ])

      setStats(statsRes.data)
      setUsersList(usersRes.data)
      setWorkspacesList(wsRes.data)
      setProjectsList(projRes.data)
      setTasksList(taskRes.data)
      setActivitiesList(actRes.data)
      setInvitationsList(inviteRes.data)
      setNotificationsList(noteRes.data)
      setAgentsList(agentRes.data)
      setDocumentsList(docRes.data)
      setWorkflowsList(wfRes.data)
      setMarketplaceList(marketRes.data)
      setMeetingsList(meetingsRes.data)

      // Get initial workspaces details
      if (wsRes.data.length > 0) {
        const firstWs = wsRes.data[0]
        setActiveWorkspace(firstWs)
        
        // Fetch channels for this workspace
        const chanRes = await axios.get(`${BACKEND_URL}/api/workspaces/${firstWs.id}/channels`, config)
        setChannels(chanRes.data)
        if (chanRes.data.length > 0) {
          setActiveChannel(chanRes.data[0])
          fetchChannelMessages(firstWs.id, chanRes.data[0].id)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error("Failed to load dashboard data", err)
      setLoading(false)
    }
  }

  const fetchChannelMessages = async (wsId: string, chanId: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.get(`${BACKEND_URL}/api/workspaces/${wsId}/chat/${chanId}`, config)
      setMessages(res.data)
    } catch (err) {
      console.error("Failed to fetch messages", err)
    }
  }

  // ─── LOGIN FLOW ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/login`, {
        email: loginEmail,
        password: loginPassword
      })

      localStorage.setItem('admin_token', res.data.token)
      localStorage.setItem('admin_user', JSON.stringify(res.data.user))
      
      setToken(res.data.token)
      setUser(res.data.user)
      setSec2FA(res.data.user.twoFactorEnabled === 1)
    } catch (err: any) {
      console.error("Login failed", err)
      setAuthError(err.response?.data?.error || "Login request rejected. Ensure you are an Admin or Founder.")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null)
    setUser(null)
  }

  // ─── USER OPERATIONS ───────────────────────────────────────────────────────
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.patch(`${BACKEND_URL}/api/admin/users/${userId}/role`, { role: newRole }, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to change user role", err)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentSuspended: boolean) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.patch(`${BACKEND_URL}/api/admin/users/${userId}/status`, { suspended: !currentSuspended }, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to toggle suspension", err)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently revoke this operator?")) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to delete user", err)
    }
  }

  const handleOnboardOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      // Reuse registration but flag in activities or run logic
      await axios.post(`${BACKEND_URL}/api/users/register`, {
        name: onboardName,
        username: onboardUsername,
        email: onboardEmail,
        password: onboardPassword,
        role: onboardRole
      }, config)

      setOnboardModalOpen(false)
      setOnboardName('')
      setOnboardUsername('')
      setOnboardEmail('')
      setOnboardPassword('')
      fetchCoreData()
    } catch (err) {
      console.error("Failed to onboard operator", err)
      alert("Failed to register operator")
    }
  }

  // ─── WORKSPACE OPERATIONS ──────────────────────────────────────────────────
  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.patch(`${BACKEND_URL}/api/admin/workspaces/${activeWorkspace.id}`, {
        name: activeWorkspace.name,
        description: activeWorkspace.description,
        logo: activeWorkspace.logo,
        industry: activeWorkspace.industry
      }, config)
      alert("Workspace configurations synced successfully.")
      fetchCoreData()
    } catch (err) {
      console.error("Failed to update workspace", err)
    }
  }

  // ─── TEAM INVITATIONS ──────────────────────────────────────────────────────
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/workspaces/${activeWorkspace.id}/invite`, {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMsg,
        senderId: user.id
      }, config)

      setInviteModalOpen(false)
      setInviteEmail('')
      setInviteMsg('')
      alert("Teammate invitation dispatched.")
      fetchCoreData()
    } catch (err: any) {
      console.error("Failed to send invite", err)
      alert(err.response?.data?.error || "Failed to invite teammate.")
    }
  }

  // ─── AGENT TUNING ──────────────────────────────────────────────────────────
  const handleOpenTuning = (agent: any) => {
    setTuningAgent(agent)
    setAgentModel(agent.model)
    setAgentTemp(agent.temperature)
    setAgentPrompt(agent.systemPrompt || `You are ${agent.name}, an AI assistant specialized in ${agent.role}.`)
  }

  const handleSaveAgentConfig = async () => {
    if (!tuningAgent) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/agents/${tuningAgent.id}/config`, {
        model: agentModel,
        temperature: agentTemp,
        systemPrompt: agentPrompt,
        enabled: tuningAgent.enabled
      }, config)

      alert(`${tuningAgent.name} settings successfully tuned.`)
      setTuningAgent(null)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to tune agent", err)
    }
  }

  const handleToggleAgentEnabled = async (agent: any) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/agents/${agent.id}/config`, {
        model: agent.model,
        temperature: agent.temperature,
        systemPrompt: agent.systemPrompt,
        enabled: !agent.enabled
      }, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to toggle agent", err)
    }
  }

  const handleInstallMarketplaceAgent = async (agentId: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/marketplace/install`, { id: agentId }, config)
      alert("AI Agent successfully deployed into active cluster.")
      fetchCoreData()
    } catch (err) {
      console.error("Failed to install agent", err)
    }
  }

  // ─── PROJECT / KANBAN OPERATIONS ──────────────────────────────────────────
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/projects`, {
        title: projectTitle,
        description: projectDesc,
        industry: projectIndustry,
        targetUsers: projectTarget
      }, config)

      setProjectModalOpen(false)
      setProjectTitle('')
      setProjectDesc('')
      setProjectTarget('')
      fetchCoreData()
    } catch (err) {
      console.error("Failed to create project", err)
    }
  }

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.patch(`${BACKEND_URL}/api/admin/tasks/${taskId}`, { status: newStatus }, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to move task", err)
    }
  }

  const handleDeleteProject = async (projId: string) => {
    if (!window.confirm("Permanently delete this project?")) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(`${BACKEND_URL}/api/admin/projects/${projId}`, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to delete project", err)
    }
  }

  // ─── TASK OPERATIONS ───────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/tasks`, {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssignee,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null
      }, config)

      setTaskModalOpen(false)
      setTaskTitle('')
      setTaskDesc('')
      setTaskDueDate('')
      fetchCoreData()
    } catch (err) {
      console.error("Failed to create task", err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Permanently delete this task?")) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.delete(`${BACKEND_URL}/api/admin/tasks/${taskId}`, config)
      fetchCoreData()
    } catch (err) {
      console.error("Failed to delete task", err)
    }
  }

  // ─── COLLABORATIVE CHAT & @MENTIONS ────────────────────────────────────────
  const handleChatInputChange = (e: any) => {
    const val = e.target.value
    setNewMessage(val)

    const mentionIndex = val.lastIndexOf('@')
    if (mentionIndex >= 0 && mentionIndex >= val.length - 15) {
      const query = val.slice(mentionIndex + 1).toLowerCase()
      setMentionSearch(query)
      setShowMentionsDropdown(true)
    } else {
      setShowMentionsDropdown(false)
    }
  }

  const handleSelectMention = (agentId: string) => {
    const mentionIndex = newMessage.lastIndexOf('@')
    const start = newMessage.slice(0, mentionIndex)
    setNewMessage(`${start}@${agentId}Agent `)
    setShowMentionsDropdown(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeWorkspace || !activeChannel) return
    
    const content = newMessage
    setNewMessage('')
    setChatLoading(true)

    // Append human message optimistically
    const mockHumanMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      userName: user.name,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, mockHumanMsg])

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${BACKEND_URL}/api/agents/completions/chat`, {
        workspaceId: activeWorkspace.id,
        channelId: activeChannel.id,
        userId: user.id,
        content
      }, config)

      // Fetch latest messages from channel to get AI responses sync
      fetchChannelMessages(activeWorkspace.id, activeChannel.id)
    } catch (err) {
      console.error("Failed to send chat message", err)
    } finally {
      setChatLoading(false)
    }
  }

  // ─── KNOWLEDGE BASE CRUD ──────────────────────────────────────────────────
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/documents`, {
        title: docTitle,
        category: docCategory,
        content: docContent
      }, config)

      setDocModalOpen(false)
      setDocTitle('')
      setDocContent('')
      fetchCoreData()
    } catch (err) {
      console.error("Failed to save doc", err)
    }
  }

  // ─── COMPANY MEMORY ENGINE ─────────────────────────────────────────────────
  const handleQueryMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memoryQuery.trim() || !activeWorkspace) return
    setMemoryLoading(true)
    setMemoryAnswer(null)

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${BACKEND_URL}/api/admin/memory/query`, {
        query: memoryQuery,
        workspaceId: activeWorkspace.id
      }, config)

      setMemoryAnswer(res.data.answer)
    } catch (err) {
      console.error("Failed to query memory", err)
      setMemoryAnswer("System Error: Failed to retrieve data layers.")
    } finally {
      setMemoryLoading(false)
    }
  }

  // ─── AI MEETING CENTER (RUN DIALOGUES) ─────────────────────────────────────
  const handleRunMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingTitle || !meetingAgenda || !activeWorkspace) return
    setMeetingLoading(true)
    setActiveMeetingDetails(null)

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${BACKEND_URL}/api/admin/meetings/run`, {
        title: meetingTitle,
        agenda: meetingAgenda,
        participants: selectedMeetingAgents,
        workspaceId: activeWorkspace.id
      }, config)

      setActiveMeetingDetails(res.data)
      setMeetingModalOpen(false)
      setMeetingTitle('')
      setMeetingAgenda('')
      fetchCoreData()
    } catch (err) {
      console.error("Failed to run virtual meeting", err)
      alert("Failed to generate virtual meeting transcript.")
    } finally {
      setMeetingLoading(false)
    }
  }

  // ─── AUTOMATION CENTER WORKFLOWS ───────────────────────────────────────────
  const handleAddWfStep = () => {
    if (!wfNewStep.trim()) return
    setWfSteps([...wfSteps, wfNewStep])
    setWfNewStep('')
  }

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wfName || !wfTrigger || wfSteps.length === 0) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/admin/automations`, {
        name: wfName,
        trigger: wfTrigger,
        steps: wfSteps
      }, config)

      setWorkflowModalOpen(false)
      setWfName('')
      setWfSteps([])
      fetchCoreData()
    } catch (err) {
      console.error("Failed to save workflow", err)
    }
  }

  // ─── VOICE COMMAND RECOGNITION ─────────────────────────────────────────────
  const handleTriggerVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition APIs.")
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onstart = () => {
      setVoiceRecording(true)
    }

    rec.onerror = (e: any) => {
      console.error("Speech Error", e)
      setVoiceRecording(false)
    }

    rec.onend = () => {
      setVoiceRecording(false)
    }

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setNewMessage(text)
      setVoiceRecording(false)
    }

    rec.start()
  }

  // ─── SECURITY FLOW ─────────────────────────────────────────────────────────
  const handleToggle2FA = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.post(`${BACKEND_URL}/api/users/toggle-2fa`, {
        userId: user.id,
        enabled: !sec2FA
      }, config)
      
      setSec2FA(res.data.enabled)
      const updatedUser = { ...user, twoFactorEnabled: res.data.enabled ? 1 : 0 }
      setUser(updatedUser)
      localStorage.setItem('admin_user', JSON.stringify(updatedUser))
      alert(`2FA security toggled: ${res.data.enabled ? 'ENABLED' : 'DISABLED'}`)
    } catch (err) {
      console.error("Failed to toggle 2FA", err)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secPassword || secPassword.length < 6) return
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${BACKEND_URL}/api/users/reset-password`, {
        userId: user.id,
        password: secPassword
      }, config)
      alert("Credentials security vector modified.")
      setSecPassword('')
    } catch (err) {
      console.error("Failed to change password", err)
    }
  }

  // ─── RENDER HELPER FILTERS ────────────────────────────────────────────────
  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userQuery.toLowerCase())
  )

  const filteredAudit = activitiesList.filter(a =>
    a.description.toLowerCase().includes(auditQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(auditQuery.toLowerCase()) ||
    (a.userName && a.userName.toLowerCase().includes(auditQuery.toLowerCase()))
  )

  const filteredDocs = documentsList.filter(d =>
    d.title.toLowerCase().includes(docQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(docQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(docQuery.toLowerCase())
  )

  // ─── RENDER LOGIN IF NO TOKEN ──────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-gray-900 to-black text-white p-6 relative overflow-hidden font-sans">
        {/* Background blobs */}
        <div className="absolute top-10 right-20 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-indigo-600 rounded-3xl mb-4 shadow-lg shadow-indigo-500/30">
              <BrainCircuit size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent leading-none">FounderOS</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-2">Executive Command Login</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-red-200 font-bold leading-normal">{authError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase ml-1">Secure Email Identity</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="root@founderos.ai"
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold tracking-widest uppercase ml-1">Access Credentials</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {authLoading ? 'Verifying Neural Match...' : 'Authorize Terminal'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: Compass },
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Operations', icon: Users },
    { id: 'workspaces', label: 'Workspace Settings', icon: Building },
    { id: 'agents', label: 'AI Control Hub', icon: Bot },
    { id: 'chat', label: 'Shared Chat', icon: MessageSquare },
    { id: 'kanban', label: 'Projects Kanban', icon: Layers },
    { id: 'tasks', label: 'Workspace Tasks', icon: ClipboardList },
    { id: 'meetings', label: 'Virtual AI Meetings', icon: Calendar },
    { id: 'knowledge', label: 'Knowledge Base', icon: FileText },
    { id: 'analytics', label: 'Charts & Load', icon: BarChart3 },
    { id: 'security', label: 'Security Center', icon: ShieldCheck },
    { id: 'logs', label: 'Audit Logs', icon: ClipboardList },
    { id: 'automations', label: 'Automation Center', icon: Zap }
  ]

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-black/35">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-white">FounderOS</h1>
              <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1 tracking-widest">Super Admin Terminal</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider text-left ${
                    activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={16} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 border-t border-white/5 bg-black/10">
            <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow shadow-indigo-500/50">
                {user.name[0].toUpperCase()}
              </div>
              <div className="text-left max-w-[140px] truncate">
                <p className="text-xs font-black text-white leading-none">{user.name}</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-4 py-3 w-full bg-red-650 hover:bg-red-500 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow shadow-red-950/20"
            >
              <LogOut size={14} />
              Lock Console
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative bg-[#F8FAFC]">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
               <h2 className="text-lg font-black capitalize tracking-tight">
                 {sidebarItems.find(s => s.id === activeTab)?.label || activeTab}
               </h2>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
               <button
                 onClick={() => {
                   setShowNotifications(!showNotifications)
                   if (!showNotifications && notificationsList.some(n => n.read === 0)) {
                     axios.post(`${BACKEND_URL}/api/admin/notifications/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
                     .then(() => fetchCoreData())
                   }
                 }}
                 className="p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all relative"
               >
                 <Bell size={20} />
                 {notificationsList.filter(n => n.read === 0).length > 0 && (
                   <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                     {notificationsList.filter(n => n.read === 0).length}
                   </span>
                 )}
               </button>

               {/* Notifications dropdown */}
               <AnimatePresence>
                 {showNotifications && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute right-0 mt-4 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 text-left p-2"
                   >
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest p-4 border-b border-gray-50">Notifications Center</p>
                     <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                       {notificationsList.length === 0 ? (
                         <p className="text-xs text-gray-400 p-6 text-center font-bold">No active warnings or events</p>
                       ) : (
                         notificationsList.map(n => (
                           <div key={n.id} className="p-4 hover:bg-gray-50 transition-all">
                             <p className="text-xs font-black text-gray-900">{n.title}</p>
                             <p className="text-[10px] text-gray-500 mt-1 font-bold leading-normal">{n.message}</p>
                           </div>
                         ))
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <button
              onClick={() => {
                alert("Core Diagnostics Completed:\n- DB integrity check passed.\n- Workspace Health matches operational standard.\n- Memory database index active.")
              }}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Run Diagnoses
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-gray-400 font-bold">
                <BrainCircuit size={48} className="animate-pulse text-indigo-600 mb-4" />
                <p className="text-sm uppercase tracking-widest">Syncing with active database clusters...</p>
             </div>
          ) : (
          <AnimatePresence mode="wait">
            {/* ─── TAB 1: EXECUTIVE COMMAND CENTER (FLAGSHIP) ───────────────── */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                {/* Hero grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Radial Health Score */}
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden text-center">
                    <div className="absolute top-4 left-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ecosystem Integrity</div>
                    <div className="relative w-40 h-40 mt-4 flex items-center justify-center">
                      {/* SVG Gauge */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="60" className="text-gray-100" strokeWidth="12" stroke="currentColor" fill="transparent" />
                        <circle cx="80" cy="80" r="60" className="text-indigo-600" strokeWidth="12" strokeDasharray={376.8} strokeDashoffset={376.8 - (376.8 * stats.healthScore) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-4xl font-black tracking-tighter leading-none">{stats.healthScore}</span>
                        <span className="text-xs text-gray-400 font-bold block mt-1 uppercase tracking-widest">Health</span>
                      </div>
                    </div>
                    <h3 className="text-base font-black tracking-tight mt-6 leading-none text-indigo-600">Company Health Score</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-2 tracking-widest">Workspace optimal state active</p>
                  </div>

                  {/* Active Agents controls */}
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">AI Employees Node Load</h4>
                        <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                      </div>
                      <div className="space-y-4">
                        {agentsList.slice(0, 4).map(ag => (
                          <div key={ag.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${ag.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-xs font-black text-gray-800">{ag.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{ag.load}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('agents')} className="w-full mt-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                      Configure AI Cluster
                    </button>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">AI Recommendations</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-indigo-50/50 rounded-xl text-left border border-indigo-100/30">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">CEO Agent Signal</p>
                          <p className="text-xs text-gray-700 mt-1 font-bold leading-normal">Tam analysis indicates high competitor density in child e-learning. Target B2B SaaS niche instead.</p>
                        </div>
                        <div className="p-3 bg-amber-50/50 rounded-xl text-left border border-amber-100/30">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Operations Warning</p>
                          <p className="text-xs text-gray-700 mt-1 font-bold leading-normal">Task backlog exceeds 10 items. Consider enabling legal or HR agents to streamline.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent messages feed */}
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 text-left">
                    <h3 className="text-base font-black tracking-tight mb-2">Workspace Activity Feed</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Real-time system state updates</p>
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                       {activitiesList.length === 0 ? (
                         <p className="text-xs text-gray-400 py-8 text-center font-bold">No system changes reported yet</p>
                       ) : (
                         activitiesList.map((act) => (
                           <div key={act.id} className="flex items-center gap-4 py-4 group">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 uppercase">
                                 {act.userName ? act.userName[0] : 'S'}
                              </div>
                              <div className="flex-1">
                                 <p className="text-xs font-bold"><span className="text-indigo-600 font-black">@{act.userName || 'System'}</span> {act.description}</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{new Date(act.createdAt).toLocaleTimeString()}</p>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                  </div>

                  {/* System states */}
                  <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white text-left flex flex-col justify-between">
                     <div>
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="font-black text-base">Ecosystem Status</h3>
                          <Zap size={18} className="text-amber-400 fill-amber-400" />
                       </div>
                       <div className="space-y-6">
                          {[
                            { label: 'PostgreSQL Core', status: 'Operational', color: 'bg-green-400' },
                            { label: 'FounderOS AI Engine', status: 'Optimal', color: 'bg-indigo-400' },
                            { label: 'Real-time Node.js', status: 'Active', color: 'bg-emerald-400' },
                            { label: 'Asset CDN', status: 'Synced', color: 'bg-blue-400' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                  <span className="text-xs font-black">{item.status}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                     </div>
                     <button
                       onClick={() => setActiveTab('overview')}
                       className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                     >
                        Run Diagnoses Dashboard
                     </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── TAB 2: SYSTEM OVERVIEW (STATS) ───────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Network Users', val: stats.users, icon: Users, color: 'text-indigo-600 bg-indigo-50', change: '+12%' },
                    { label: 'Active Workspaces', val: stats.workspaces, icon: Building, color: 'text-amber-600 bg-amber-50', change: '+5%' },
                    { label: 'AI Messages count', val: stats.messages, icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50', change: 'LIVE' },
                    { label: 'Venture Projects', val: stats.projects, icon: Layers, color: 'text-purple-600 bg-purple-50', change: 'ACTIVE' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${s.color}`}>
                          <s.icon size={22} />
                        </div>
                        <span className="text-[9px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-lg">{s.change}</span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                        <h3 className="text-2xl font-black mt-2 tracking-tight">{s.val}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm text-left">
                      <h3 className="text-base font-black tracking-tight mb-6">Database Health Indicators</h3>
                      <div className="space-y-4">
                         {[
                           { name: "Active Database Connection Limits", usage: "34 / 100 connections", progress: 34 },
                           { name: "Write Queries Delay Vector", usage: "12ms (Optimal)", progress: 12 },
                           { name: "Redis Cache Hit Ratio", usage: "94% optimal key retrieval", progress: 94 }
                         ].map((item, idx) => (
                           <div key={idx} className="space-y-2">
                             <div className="flex justify-between text-xs font-bold text-gray-700">
                                <span>{item.name}</span>
                                <span>{item.usage}</span>
                             </div>
                             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${item.progress}%` }} />
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                           <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><HardDrive size={22} /></div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Storage Consumption</p>
                              <h4 className="text-xl font-black mt-1">{stats.storage} / 10 GB</h4>
                           </div>
                        </div>
                        <p className="text-xs text-gray-500 font-bold leading-normal">
                          Shared business documents, SOP libraries, raw AI conversational memory files, and venture logs.
                        </p>
                      </div>
                      <div className="mt-6">
                        <div className="h-2 bg-gray-150 rounded-full overflow-hidden mb-2">
                           <div className="h-full bg-amber-500 w-[12%]" />
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">12% Allocation Synced</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ─── TAB 3: USER OPERATIONS (MANAGEMENT) ──────────────────────── */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="text-left">
                       <h3 className="text-xl font-black tracking-tight">Operator Administration</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Master Operator Directory</p>
                    </div>
                    <button
                      onClick={() => setOnboardModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow active:scale-95 transition-all"
                    >
                       Onboard Operator
                    </button>
                 </div>

                 <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 text-left">
                    <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                       <Search size={18} className="text-gray-400 ml-2" />
                       <input
                         type="text"
                         value={userQuery}
                         onChange={e => setUserQuery(e.target.value)}
                         placeholder="Filter operators by name, username, role or email..."
                         className="bg-transparent border-none outline-none flex-1 font-bold text-xs"
                       />
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-gray-100">
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Identity</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Plan & Status</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Access Level</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {filteredUsers.map((u: any) => (
                               <tr key={u.id} className="group hover:bg-gray-50/50 transition-all">
                                  <td className="py-5">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm border border-indigo-100">
                                           {u.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-gray-900">{u.name}</p>
                                           <p className="text-[10px] font-bold text-gray-400 mt-1">@{u.username} · {u.email}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="py-5">
                                     <div className="flex items-center gap-3">
                                       <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100">{u.plan}</span>
                                       <span className={`w-2.5 h-2.5 rounded-full ${u.preferences?.suspended ? 'bg-red-500' : 'bg-green-500'}`} />
                                       <span className="text-[10px] font-bold text-gray-500">{u.preferences?.suspended ? 'SUSPENDED' : 'ACTIVE'}</span>
                                     </div>
                                  </td>
                                  <td className="py-5">
                                     <select
                                       value={u.role}
                                       onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                       className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none"
                                     >
                                       <option value="Founder">Founder (Admin)</option>
                                       <option value="Manager">Manager</option>
                                       <option value="member">Workspace Member</option>
                                       <option value="guest">Guest</option>
                                     </select>
                                  </td>
                                  <td className="py-5 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleToggleUserStatus(u.id, u.preferences?.suspended)}
                                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${
                                            u.preferences?.suspended
                                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                          }`}
                                        >
                                           {u.preferences?.suspended ? 'Activate' : 'Suspend'}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u.id)}
                                          disabled={u.id === user.id}
                                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 4: WORKSPACE SETTINGS ────────────────────────────────── */}
            {activeTab === 'workspaces' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                <div className="max-w-2xl bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                   <h3 className="text-xl font-black tracking-tight mb-8">Workspace Settings</h3>
                   {activeWorkspace ? (
                     <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                        <div className="flex items-center gap-6 mb-8">
                           <div className="w-20 h-20 bg-indigo-50 border border-indigo-150 rounded-[2rem] flex items-center justify-center font-black text-indigo-600 text-3xl shadow-sm">
                              {activeWorkspace.logo ? (
                                <img src={activeWorkspace.logo} alt="logo" className="w-full h-full object-cover rounded-[2rem]" />
                              ) : (
                                activeWorkspace.name[0].toUpperCase()
                              )}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Workspace Logo URL</label>
                              <input
                                type="text"
                                value={activeWorkspace.logo || ''}
                                onChange={e => setActiveWorkspace({ ...activeWorkspace, logo: e.target.value })}
                                placeholder="http://domain.com/logo.png"
                                className="w-80 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none font-bold"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Workspace Name</label>
                           <input
                             type="text"
                             required
                             value={activeWorkspace.name}
                             onChange={e => setActiveWorkspace({ ...activeWorkspace, name: e.target.value })}
                             placeholder="My Venture Platform"
                             className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none font-bold"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Operational Industry</label>
                           <input
                             type="text"
                             value={activeWorkspace.industry || ''}
                             onChange={e => setActiveWorkspace({ ...activeWorkspace, industry: e.target.value })}
                             placeholder="AI SaaS Development"
                             className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none font-bold"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Company Brief Description</label>
                           <textarea
                             value={activeWorkspace.description || ''}
                             onChange={e => setActiveWorkspace({ ...activeWorkspace, description: e.target.value })}
                             placeholder="Workspace description briefing..."
                             rows={4}
                             className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none font-bold"
                           />
                        </div>

                        <div className="flex gap-4 pt-4">
                           <button
                             type="submit"
                             className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow"
                           >
                              Save Workspace
                           </button>
                           <button
                             type="button"
                             onClick={() => setActiveTab('dashboard')}
                             className="px-6 py-3 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest"
                           >
                              Cancel
                           </button>
                        </div>
                     </form>
                   ) : (
                     <p className="text-xs text-gray-400 font-bold">No workspace found.</p>
                   )}
                </div>
              </motion.div>
            )}

            {/* ─── TAB 5: AI AGENT CONTROL HUB & MARKETPLACE ────────────────── */}
            {activeTab === 'agents' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-left">
                  <div className="space-y-6">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">AI Executive Control Center</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Management of deployed agent entities</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                       {agentsList.map((ag) => (
                         <div key={ag.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-6">
                                 <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow shadow-gray-200">
                                    <Bot size={26} />
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                      !ag.enabled ? 'bg-gray-100 text-gray-400' :
                                      ag.status === 'Thinking' ? 'bg-indigo-150 text-indigo-650 animate-pulse' :
                                      ag.status === 'Executing' ? 'bg-green-150 text-green-650 animate-pulse' :
                                      'bg-green-100 text-green-600'
                                    }`}>
                                       {!ag.enabled ? 'Disabled' : ag.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Neural Load: {ag.load}</span>
                                 </div>
                              </div>
                              <h4 className="text-base font-black tracking-tight">{ag.name}</h4>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-4">{ag.model}</p>
                              <p className="text-xs text-gray-500 font-bold leading-normal mb-6 truncate">{ag.role}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                               <button
                                 onClick={() => handleOpenTuning(ag)}
                                 className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                               >
                                  Tune Prompt
                               </button>
                               <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active State</span>
                                 <button
                                   onClick={() => handleToggleAgentEnabled(ag)}
                                   className={`w-9 h-5 rounded-full p-0.5 transition-all outline-none ${ag.enabled ? 'bg-indigo-600 flex justify-end' : 'bg-gray-200 flex justify-start'}`}
                                 >
                                   <div className="w-4 h-4 bg-white rounded-full shadow" />
                                 </button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Marketplace */}
                  <div className="space-y-6 pt-6 border-t border-gray-100">
                    <div>
                       <h3 className="text-lg font-black tracking-tight">AI Agent Marketplace</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Acquire extra operational intelligence agents</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {marketplaceList.map(a => (
                        <div key={a.id} className="bg-white/60 border border-gray-150 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-black uppercase rounded border">Marketplace Catalog</span>
                              {a.installed && <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">DEPLOYED</span>}
                            </div>
                            <h4 className="text-base font-black tracking-tight">{a.name}</h4>
                            <p className="text-xs text-gray-500 font-bold mt-2 leading-normal">{a.role}</p>
                          </div>
                          <button
                            onClick={() => handleInstallMarketplaceAgent(a.id)}
                            disabled={a.installed}
                            className={`w-full mt-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                              a.installed
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-600/30'
                            }`}
                          >
                            {a.installed ? 'Installed' : 'Deploy Agent'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
              </motion.div>
            )}

            {/* ─── TAB 6: SHARED CHAT & @MENTIONS ───────────────────────────── */}
            {activeTab === 'chat' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[76vh] flex bg-white rounded-[2rem] border border-gray-150 overflow-hidden shadow-sm text-left">
                 {/* Channels Sidebar */}
                 <div className="w-64 border-r border-gray-150 bg-gray-50 flex flex-col justify-between">
                    <div>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest p-6 border-b border-gray-150">Active Workspaces Channels</p>
                       <div className="p-3 space-y-1">
                          {channels.map(chan => (
                            <button
                              key={chan.id}
                              onClick={() => {
                                setActiveChannel(chan)
                                if (activeWorkspace) fetchChannelMessages(activeWorkspace.id, chan.id)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                                activeChannel?.id === chan.id
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-500 hover:bg-gray-150'
                              }`}
                            >
                              <span>#</span>
                              {chan.name}
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="p-6 border-t border-gray-150">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-normal mb-2">Cognitive Core</p>
                      <button
                        onClick={() => {
                          const agenda = prompt("What topic or roadmap agenda will they deliberate?")
                          if (agenda) {
                            setMeetingTitle("Virtual Strategic Deliberation")
                            setMeetingAgenda(agenda)
                            setMeetingModalOpen(true)
                          }
                        }}
                        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-[10px] uppercase tracking-wider text-center"
                      >
                        Run AI Meeting
                      </button>
                    </div>
                 </div>

                 {/* Message Stream */}
                 <div className="flex-1 flex flex-col justify-between bg-white relative">
                    <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/20">
                       <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                          #{activeChannel?.name || 'chat'}
                       </h4>
                       <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded border border-indigo-100/50 uppercase tracking-widest">
                          Active Collaborative Mode
                       </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       {messages.map((m: any) => (
                         <div key={m.id} className={`flex items-start gap-4 ${m.role === 'assistant' ? 'bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/10' : ''}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                              m.role === 'assistant' ? 'bg-indigo-600' : 'bg-gray-700'
                            }`}>
                               {m.role === 'assistant' ? 'AI' : (m.userName ? m.userName[0].toUpperCase() : 'H')}
                            </div>
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-gray-900">
                                     {m.role === 'assistant' ? (m.agentId ? `${m.agentId.toUpperCase()} Agent` : 'Founder Agent') : (m.userName || 'Operator')}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{new Date(m.createdAt).toLocaleTimeString()}</span>
                               </div>
                               <div className="text-xs text-gray-700 mt-2 font-bold leading-relaxed whitespace-pre-wrap">
                                  {m.content}
                               </div>
                            </div>
                         </div>
                       ))}
                       {chatLoading && (
                         <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest">
                           <Bot className="animate-bounce" size={16} />
                           AI Agent is formulating strategic response...
                         </div>
                       )}
                       <div ref={chatBottomRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-150 bg-gray-50/50 relative">
                       {/* Mentions Autocomplete dropdown */}
                       <AnimatePresence>
                         {showMentionsDropdown && (
                           <motion.div
                             initial={{ opacity: 0, y: -10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -10 }}
                             className="absolute bottom-24 left-6 w-64 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-2 text-left"
                           >
                             <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest p-2 border-b">Ecosystem AI Agents</p>
                             <div className="max-h-40 overflow-y-auto mt-1 space-y-1">
                               {agentsList.filter(a => a.enabled && a.id.toLowerCase().includes(mentionSearch)).map(ag => (
                                 <button
                                   key={ag.id}
                                   type="button"
                                   onClick={() => handleSelectMention(ag.id)}
                                   className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-indigo-50 rounded-lg text-gray-800 transition-all flex items-center justify-between"
                                 >
                                   <span>{ag.name}</span>
                                   <span className="text-[8px] bg-gray-100 text-gray-400 px-1 rounded uppercase">{ag.status}</span>
                                 </button>
                               ))}
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>

                       <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={handleTriggerVoiceCommand}
                            className={`p-3 rounded-2xl transition-all border ${
                              voiceRecording
                              ? 'bg-red-500 text-white animate-pulse border-red-300'
                              : 'bg-white text-gray-400 hover:text-gray-900 border-gray-200'
                            }`}
                          >
                             <Mic size={18} />
                          </button>

                          <input
                            type="text"
                            value={newMessage}
                            onChange={handleChatInputChange}
                            placeholder="Type a query, or mention @FounderAgent to orchestrate tasks..."
                            className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-gray-900 transition-all"
                          />

                          <button
                            type="submit"
                            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                             Dispatch
                          </button>
                       </div>
                    </form>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 7: PROJECTS KANBAN BOARD ────────────────────────────── */}
            {activeTab === 'kanban' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Project Board</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Kanban workflows for product ventures</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setProjectModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow"
                      >
                         Initialize Venture
                      </button>
                    </div>
                 </div>

                 {/* Kanban Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {['todo', 'in_progress', 'review', 'done'].map((col) => (
                      <div key={col} className="bg-gray-100/50 border border-gray-200 rounded-[2rem] p-6 flex flex-col min-h-[50vh]">
                         <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">
                               {col.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-white rounded border text-gray-500">
                               {tasksList.filter(t => t.status === col).length}
                            </span>
                         </div>

                         <div className="flex-1 space-y-4">
                            {tasksList.filter(t => t.status === col).map((task) => (
                              <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                                 <h4 className="text-xs font-black text-gray-900 tracking-tight leading-snug">{task.title}</h4>
                                 <p className="text-[10px] text-gray-500 font-bold leading-normal truncate">{task.description}</p>
                                 <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-400 tracking-widest pt-3 border-t">
                                    <span className={`px-2 py-0.5 rounded ${
                                      task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                      task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                      'bg-green-50 text-green-600'
                                    }`}>
                                       {task.priority}
                                    </span>
                                    <span>{task.assignedTo || 'Unassigned'}</span>
                                 </div>
                                 <div className="flex items-center gap-2 pt-2">
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleMoveTask(task.id, e.target.value)}
                                      className="w-full text-[9px] font-black uppercase tracking-wider py-1 border border-gray-150 rounded bg-gray-50 text-gray-650 cursor-pointer text-center"
                                    >
                                       <option value="todo">To Do</option>
                                       <option value="in_progress">In Progress</option>
                                       <option value="review">Review</option>
                                       <option value="done">Done</option>
                                    </select>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Projects List catalog */}
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-base font-black tracking-tight mb-6">Strategic Projects List</h3>
                    <div className="space-y-4">
                       {projectsList.map((p) => (
                         <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border hover:border-indigo-150 transition-all">
                            <div>
                               <h4 className="text-sm font-black text-gray-900">{p.title}</h4>
                               <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{p.industry} · Target: {p.targetUsers}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600" style={{ width: `${p.progress}%` }} />
                               </div>
                               <span className="text-xs font-black text-indigo-600">{p.progress}%</span>
                               <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 8: TASKS LIST DIRECTORY ──────────────────────────────── */}
            {activeTab === 'tasks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Workspace Tasks</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Grid view of tasks assignments</p>
                    </div>
                    <button
                      onClick={() => setTaskModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow"
                    >
                       Create Task
                    </button>
                 </div>

                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-gray-100">
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Task Title</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Assignee</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Priority</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Delete</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {tasksList.map((t: any) => (
                               <tr key={t.id} className="group hover:bg-gray-50/50 transition-all">
                                  <td className="py-5">
                                     <p className="text-xs font-black text-gray-900">{t.title}</p>
                                     <p className="text-[10px] text-gray-400 mt-1 font-bold">{t.description || 'No description provided'}</p>
                                  </td>
                                  <td className="py-5">
                                     <span className="text-xs font-bold text-gray-700">{t.assignedTo}</span>
                                  </td>
                                  <td className="py-5">
                                     <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                       t.priority === 'high' ? 'bg-red-50 text-red-600' :
                                       t.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                       'bg-green-50 text-green-600'
                                     }`}>
                                       {t.priority}
                                     </span>
                                  </td>
                                  <td className="py-5">
                                     <select
                                       value={t.status}
                                       onChange={(e) => handleMoveTask(t.id, e.target.value)}
                                       className="px-2 py-1 bg-gray-50 border border-gray-250 rounded font-black text-[9px] uppercase tracking-wider outline-none"
                                     >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                     </select>
                                  </td>
                                  <td className="py-5 text-right">
                                     <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                                        <Trash2 size={16} />
                                     </button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 9: AI MEETING CENTER (GENERATOR) ────────────────────── */}
            {activeTab === 'meetings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">AI Virtual Meeting Center</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Run virtual boardroom meetings with AI employees</p>
                    </div>
                    <button
                      onClick={() => setMeetingModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow"
                    >
                       Run Meeting
                    </button>
                 </div>

                 {/* Meeting layout details */}
                 {activeMeetingDetails && (
                    <div className="bg-indigo-950 text-white rounded-[2rem] p-10 border border-indigo-900 shadow-xl space-y-6">
                       <div className="flex items-center justify-between border-b border-indigo-900 pb-6">
                          <div>
                             <h4 className="text-lg font-black tracking-tight">{activeMeetingDetails.title}</h4>
                             <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Agenda: {activeMeetingDetails.agenda}</p>
                          </div>
                          <button
                            onClick={() => setActiveMeetingDetails(null)}
                            className="p-2 bg-indigo-900 hover:bg-indigo-850 rounded-xl transition-all"
                          >
                             <X size={18} />
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                          <div className="lg:col-span-2 space-y-4 max-h-96 overflow-y-auto pr-4">
                             <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Meeting Dialog Transcript</p>
                             <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-xl border border-indigo-900/30">
                                {activeMeetingDetails.summary}
                             </p>
                          </div>
                          
                          <div className="space-y-6">
                             <div className="p-4 bg-black/20 border border-indigo-900/30 rounded-2xl text-left">
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-3">Key Decisions</p>
                                <ul className="space-y-2 list-disc pl-4 text-xs font-bold text-gray-300">
                                   {activeMeetingDetails.decisions?.map((d: string, i: number) => (
                                     <li key={i}>{d}</li>
                                   ))}
                                </ul>
                             </div>
                             
                             <div className="p-4 bg-black/20 border border-indigo-900/30 rounded-2xl text-left">
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-3">Action Items Assigned</p>
                                <ul className="space-y-2 list-disc pl-4 text-xs font-bold text-gray-300">
                                   {activeMeetingDetails.actionItems?.map((a: string, i: number) => (
                                     <li key={i}>{a}</li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* History of meetings */}
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-base font-black tracking-tight mb-6">Historical Boardroom Minutes</h3>
                    <div className="space-y-4">
                       {meetingsList.map((m) => (
                         <div
                           key={m.id}
                           onClick={() => setActiveMeetingDetails(m)}
                           className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border hover:border-indigo-150 transition-all cursor-pointer"
                         >
                            <div>
                               <h4 className="text-sm font-black text-gray-900">{m.title}</h4>
                               <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Agenda: {m.agenda} · {new Date(m.createdAt).toLocaleDateString()}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-400" />
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 10: KNOWLEDGE BASE ──────────────────────────────────── */}
            {activeTab === 'knowledge' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Company Knowledge Base</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">SOPs, competitor intelligence & business files</p>
                    </div>
                    <button
                      onClick={() => setDocModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow"
                    >
                       Add Document
                    </button>
                 </div>

                 {/* Memory query bar */}
                 <div className="bg-indigo-900 text-white rounded-[2rem] p-8 border border-indigo-800 shadow-xl space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest">Query Company Memory</h4>
                    <p className="text-xs text-indigo-300 font-bold leading-normal">
                      The cognitive neural engine queries all historical meeting transcripts, chats, and SOP documents to retrieve decisions.
                    </p>
                    <form onSubmit={handleQueryMemory} className="flex gap-4">
                       <input
                         type="text"
                         value={memoryQuery}
                         onChange={e => setMemoryQuery(e.target.value)}
                         placeholder="e.g. What TAM details did we decide last week?"
                         className="flex-1 px-5 py-3.5 bg-black/20 border border-indigo-700 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-400 transition-all"
                       />
                       <button
                         type="submit"
                         disabled={memoryLoading}
                         className="bg-white hover:bg-gray-100 text-indigo-900 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                       >
                          {memoryLoading ? 'Thinking...' : 'Ask Founder Agent'}
                       </button>
                    </form>

                    {memoryAnswer && (
                       <div className="p-4 bg-black/25 border border-indigo-850 rounded-2xl text-xs font-bold leading-relaxed text-gray-200 mt-4 whitespace-pre-wrap font-mono">
                          {memoryAnswer}
                       </div>
                    )}
                 </div>

                 {/* Documents Explorer */}
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                       <Search size={18} className="text-gray-400 ml-2" />
                       <input
                         type="text"
                         value={docQuery}
                         onChange={e => setDocQuery(e.target.value)}
                         placeholder="Search business documents and SOPs..."
                         className="bg-transparent border-none outline-none flex-1 font-bold text-xs"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {filteredDocs.map((doc) => (
                         <div key={doc.id} className="p-6 bg-gray-50 border rounded-[1.5rem] hover:border-indigo-150 transition-all space-y-4">
                            <div className="flex items-center justify-between">
                               <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-black uppercase rounded">
                                  {doc.category}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400">{doc.author} · {new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-black text-gray-900 leading-snug">{doc.title}</h4>
                            <div className="text-xs text-gray-600 font-bold leading-relaxed whitespace-pre-wrap bg-white border border-gray-100 p-4 rounded-xl">
                               {doc.content}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 11: CHARTS & LOAD (ANALYTICS) ────────────────────────── */}
            {activeTab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* SVG graph 1 */}
                     <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-base font-black tracking-tight mb-6">Neural CPU Load History</h3>
                        <div className="h-48 flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
                           {[20, 45, 60, 35, 75, 90, 82].map((val, idx) => (
                             <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t-lg transition-all" style={{ height: `${val * 1.5}px` }} />
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Day {idx+1}</span>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* SVG graph 2 */}
                     <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-base font-black tracking-tight mb-6">Workspace Messages volume</h3>
                        <div className="h-48 flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
                           {[12, 28, 45, 65, 88, 120, 154].map((val, idx) => (
                             <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-lg transition-all" style={{ height: `${val * 1}px` }} />
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hour {idx+1}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
              </motion.div>
            )}

            {/* ─── TAB 12: SECURITY CENTER ──────────────────────────────────── */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left max-w-3xl">
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-8">
                    <h3 className="text-xl font-black tracking-tight">Zero-Trust Security Center</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-2xl">
                       <div>
                          <p className="text-sm font-black text-gray-900">Two-Factor Authentication (2FA)</p>
                          <p className="text-xs text-gray-500 mt-1 font-bold leading-normal">Require secure OTP email confirmation on authorization.</p>
                       </div>
                       <button
                         onClick={handleToggle2FA}
                         className={`w-12 h-6 rounded-full p-1 transition-all outline-none ${sec2FA ? 'bg-indigo-600 flex justify-end' : 'bg-gray-200 flex justify-start'}`}
                       >
                          <div className="w-4 h-4 bg-white rounded-full shadow" />
                       </button>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                       <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Change Access Password</p>
                       <div className="flex gap-4">
                          <input
                            type="password"
                            required
                            value={secPassword}
                            onChange={e => setSecPassword(e.target.value)}
                            placeholder="New secure password..."
                            className="flex-1 px-5 py-3.5 bg-gray-50 border rounded-2xl text-xs font-bold outline-none"
                          />
                          <button type="submit" className="px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                             Update Credentials
                          </button>
                       </div>
                    </form>

                    <div className="space-y-4">
                       <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Critical Security events</p>
                       <div className="space-y-3">
                          {[
                            { name: "Suspicious Login Attempt", detail: "Singapore · 14:20:01", status: "BLOCKED", color: "text-red-650 bg-red-50 border-red-200" },
                            { name: "API Secret Rotation", detail: "System Core · 12:05:55", status: "COMPLETED", color: "text-indigo-650 bg-indigo-50 border-indigo-200" }
                          ].map((evt, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border">
                               <div>
                                  <p className="text-xs font-black text-gray-800">{evt.name}</p>
                                  <p className="text-[10px] text-gray-400 mt-1 font-bold">{evt.detail}</p>
                               </div>
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${evt.color}`}>
                                  {evt.status}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 13: AUDIT LOGS ───────────────────────────────────────── */}
            {activeTab === 'logs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-xl font-black tracking-tight mb-2">Audit Trails</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Ecosystem-wide operation logs</p>

                    <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                       <Search size={18} className="text-gray-400 ml-2" />
                       <input
                         type="text"
                         value={auditQuery}
                         onChange={e => setAuditQuery(e.target.value)}
                         placeholder="Filter audit logs by description, operator name or action type..."
                         className="bg-transparent border-none outline-none flex-1 font-bold text-xs"
                       />
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-gray-100">
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Timestamp</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Operator</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Action Type</th>
                                <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Description</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {filteredAudit.map((log: any) => (
                               <tr key={log.id} className="hover:bg-gray-50/50 transition-all">
                                  <td className="py-4 text-[10px] font-bold text-gray-400">
                                     {new Date(log.createdAt).toLocaleString()}
                                  </td>
                                  <td className="py-4 text-xs font-black text-gray-800">
                                     @{log.userName || 'System'}
                                  </td>
                                  <td className="py-4">
                                     <span className="px-2 py-0.5 bg-gray-100 border rounded text-[9px] font-black uppercase text-gray-600">
                                        {log.type}
                                     </span>
                                  </td>
                                  <td className="py-4 text-xs font-bold text-gray-700 leading-normal">
                                     {log.description}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* ─── TAB 14: AUTOMATION WORKFLOWS ────────────────────────────── */}
            {activeTab === 'automations' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Automation Workflows</h3>
                       <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Multi-agent automatic pipeline configuration</p>
                    </div>
                    <button
                      onClick={() => setWorkflowModalOpen(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow"
                    >
                       Configure Workflow
                    </button>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {workflowsList.map((wf) => (
                      <div key={wf.id} className="bg-white rounded-[2rem] border border-gray-150 p-8 shadow-sm flex flex-col justify-between">
                         <div>
                            <div className="flex items-center justify-between mb-6">
                               <h4 className="text-sm font-black text-gray-900">{wf.name}</h4>
                               <span className="px-2.5 py-0.5 bg-green-50 border border-green-200 text-green-650 text-[9px] font-black rounded-lg">ACTIVE</span>
                            </div>
                            
                            <div className="space-y-2">
                               <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Trigger event</p>
                               <div className="p-3 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700">{wf.trigger}</div>
                            </div>
                            
                            {/* Steps representation */}
                            <div className="space-y-2 mt-6">
                               <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Agent Chain Steps</p>
                               <div className="space-y-3">
                                  {wf.steps.map((step: string, sIdx: number) => (
                                    <div key={sIdx} className="flex items-center gap-3">
                                       <span className="w-5 h-5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600">{sIdx+1}</span>
                                       <span className="text-xs font-bold text-gray-700">{step}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </main>

      {/* ─── MODAL DIALOGS ─────────────────────────────────────────────────── */}
      {/* 1. Send invite modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Invite Workspace Teammate</h4>
                 <button onClick={() => setInviteModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleSendInvite} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Secure Email Identity</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="teammate@domain.com"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Default Workspace Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="admin">Workspace Admin</option>
                       <option value="manager">Manager</option>
                       <option value="member">Workspace Member</option>
                       <option value="guest">Guest</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Custom Invitation Message</label>
                    <textarea
                      value={inviteMsg}
                      onChange={e => setInviteMsg(e.target.value)}
                      placeholder="Join our FounderOS AI Workspace..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Dispatch Invitation
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 2. Onboard Operator modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Onboard Workspace Operator</h4>
                 <button onClick={() => setOnboardModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleOnboardOperator} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Full Identity Name</label>
                    <input
                      type="text"
                      required
                      value={onboardName}
                      onChange={e => setOnboardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Unique Username</label>
                    <input
                      type="text"
                      required
                      value={onboardUsername}
                      onChange={e => setOnboardUsername(e.target.value)}
                      placeholder="johndoe"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Email Identity</label>
                    <input
                      type="email"
                      required
                      value={onboardEmail}
                      onChange={e => setOnboardEmail(e.target.value)}
                      placeholder="john@domain.com"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={onboardPassword}
                      onChange={e => setOnboardPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Operator Access level</label>
                    <select
                      value={onboardRole}
                      onChange={e => setOnboardRole(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="Founder">Founder (Admin)</option>
                       <option value="Manager">Manager</option>
                       <option value="member">Workspace Member</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Register Operator
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 3. Initialize Venture Plan project modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Initialize Venture Plan</h4>
                 <button onClick={() => setProjectModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Venture Title</label>
                    <input
                      type="text"
                      required
                      value={projectTitle}
                      onChange={e => setProjectTitle(e.target.value)}
                      placeholder="e.g. AI Resume Builder"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Brief Pitch Description</label>
                    <textarea
                      value={projectDesc}
                      onChange={e => setProjectDesc(e.target.value)}
                      placeholder="What does this startup do..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Market Industry</label>
                    <select
                      value={projectIndustry}
                      onChange={e => setProjectIndustry(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="AI / ML Tools">AI / ML Tools</option>
                       <option value="SaaS / B2B">SaaS / B2B</option>
                       <option value="FinTech">FinTech</option>
                       <option value="HealthTech">HealthTech</option>
                       <option value="EdTech">EdTech</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Target Users</label>
                    <input
                      type="text"
                      required
                      value={projectTarget}
                      onChange={e => setProjectTarget(e.target.value)}
                      placeholder="e.g. Remote Developers, HR Professionals"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Register Startup Venture
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 4. Create task modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Create Workspace Task</h4>
                 <button onClick={() => setTaskModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Task Title</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder="e.g. Create Landing Page"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Task Details</label>
                    <textarea
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      placeholder="Describe target goals..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Workspace Assignee</label>
                    <select
                      value={taskAssignee}
                      onChange={e => setTaskAssignee(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="founder">Founder Agent</option>
                       <option value="ceo">CEO Agent</option>
                       <option value="coding">Coding Agent</option>
                       <option value="marketing">Marketing Agent</option>
                       <option value="research">Research Agent</option>
                       {usersList.map(u => (
                         <option key={u.id} value={`@${u.username}`}>@{u.username} (Human)</option>
                       ))}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Priority</label>
                       <select
                         value={taskPriority}
                         onChange={e => setTaskPriority(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                       >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Status</label>
                       <select
                         value={taskStatus}
                         onChange={e => setTaskStatus(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                       >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none text-gray-600"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Deploy Task Card
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 5. Add document modal */}
      {docModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Add Business Plan / SOP Document</h4>
                 <button onClick={() => setDocModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateDocument} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Document Title</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      placeholder="e.g. Q3 Growth Strategy Playbook"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Document Category</label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="SOP">SOP (Operational Playbook)</option>
                       <option value="Research">Competitor Research Report</option>
                       <option value="Business Plan">Business Plan Blueprint</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Markdown Styled Content</label>
                    <textarea
                      required
                      value={docContent}
                      onChange={e => setDocContent(e.target.value)}
                      placeholder="# Heading 1&#10;&#10;- Bullet item..."
                      rows={8}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none font-mono"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Archive Document Blueprint
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 6. AI Meeting Runner modal */}
      {meetingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Run AI Boardroom Meeting</h4>
                 <button onClick={() => setMeetingModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleRunMeeting} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Meeting Title</label>
                    <input
                      type="text"
                      required
                      value={meetingTitle}
                      onChange={e => setMeetingTitle(e.target.value)}
                      placeholder="e.g. Q3 Launch Strategic Deliberation"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Roadmap Agenda Target</label>
                    <textarea
                      required
                      value={meetingAgenda}
                      onChange={e => setMeetingAgenda(e.target.value)}
                      placeholder="Formulate strategy timeline for AI Resume Builder..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Deliberating Board Agents</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['founder', 'ceo', 'coding', 'marketing', 'research', 'legal'].map(agId => (
                         <label key={agId} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100 transition-all select-none">
                            <input
                              type="checkbox"
                              checked={selectedMeetingAgents.includes(agId)}
                              onChange={(e) => {
                                 if (e.target.checked) {
                                    setSelectedMeetingAgents([...selectedMeetingAgents, agId])
                                 } else {
                                    setSelectedMeetingAgents(selectedMeetingAgents.filter(a => a !== agId))
                                 }
                              }}
                              className="accent-indigo-600 rounded"
                            />
                            <span>{agentsList.find(a => a.id === agId)?.name || agId}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <button
                   type="submit"
                   disabled={meetingLoading}
                   className="w-full py-4 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow transition-all active:scale-95 disabled:opacity-50"
                 >
                    {meetingLoading ? 'Generating Board Transcripts...' : 'Generate Dialogue Meeting'}
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 7. Configure Automation Workflow modal */}
      {workflowModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Configure Automation Workflow</h4>
                 <button onClick={() => setWorkflowModalOpen(false)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Workflow Label</label>
                    <input
                      type="text"
                      required
                      value={wfName}
                      onChange={e => setWfName(e.target.value)}
                      placeholder="e.g. Competitive TAM Assessment"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Trigger Event</label>
                    <input
                      type="text"
                      required
                      value={wfTrigger}
                      onChange={e => setWfTrigger(e.target.value)}
                      placeholder="e.g. New Project venture created"
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Configure Action steps</label>
                    <div className="flex gap-2">
                       <input
                         type="text"
                         value={wfNewStep}
                         onChange={e => setWfNewStep(e.target.value)}
                         placeholder="e.g. Research Agent competitor analysis"
                         className="flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                       />
                       <button
                         type="button"
                         onClick={handleAddWfStep}
                         className="px-4 bg-gray-950 hover:bg-gray-900 text-white font-black text-xs rounded-xl uppercase tracking-wider"
                       >
                          Add
                       </button>
                    </div>
                    
                    <div className="space-y-2 max-h-24 overflow-y-auto mt-2">
                       {wfSteps.map((s, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border text-xs font-bold text-gray-700">
                            <span>{idx+1}. {s}</span>
                            <button
                              type="button"
                              onClick={() => setWfSteps(wfSteps.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-red-500 font-black"
                            >
                               x
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Sync Automation Flow
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* 8. Tuning Agent Modal */}
      {tuningAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 text-left">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] border p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-base font-black tracking-tight text-gray-900">Tune AI Prompt Instructs: {tuningAgent.name}</h4>
                 <button onClick={() => setTuningAgent(null)} className="p-2 hover:bg-gray-150 rounded-xl transition-all"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Deployed LLM model Selection</label>
                    <select
                      value={agentModel}
                      onChange={e => setAgentModel(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none"
                    >
                       <option value="llama-3.3-70b-versatile">Llama-3.3-70B (Orchestrator)</option>
                       <option value="llama-3.2-11b-vision-preview">Llama-3.2-Vision</option>
                    </select>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">Temperature Weight (Randomness): {agentTemp}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={agentTemp}
                      onChange={e => setAgentTemp(parseFloat(e.target.value))}
                      className="w-full accent-indigo-650 cursor-pointer"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-black tracking-widest uppercase ml-1">System Instructions Prompt</label>
                    <textarea
                      value={agentPrompt}
                      onChange={e => setAgentPrompt(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-xs font-bold outline-none font-mono"
                    />
                 </div>

                 <button
                   onClick={handleSaveAgentConfig}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                 >
                    Apply Prompt Configurations
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default App
