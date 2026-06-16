import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions, Modal,
  Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore, Workspace } from "@/store/workspace-store";
import { useSocialStore } from "@/store/social-store";
import { BACKEND_URL, AGENT_CONFIG } from "@/constants";
import * as SecureStore from "expo-secure-store";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  Plus, Bell, ChevronRight, LayoutDashboard, BrainCircuit, Rocket,
  Zap, Activity, CheckCircle2, Users, FileText, PieChart, Shield,
  Command, Terminal, ArrowUpRight, Clock, Settings, X,
  Crown, Briefcase, Search, Code, Megaphone, Calendar, Wrench, Headphones, Bot,
  Scale, Cpu, Sparkles, MessageSquare
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";

// Explicit icon mapping to avoid ReferenceErrors
const ICON_MAP: Record<string, any> = {
  Crown,
  Briefcase,
  Search,
  Code,
  Megaphone,
  Calendar,
  Wrench,
  Headphones,
  Bot,
  Scale,
  PieChart,
  Cpu,
  Sparkles
};

export default function WorkspaceHomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { activeWorkspace, workspaces, fetchWorkspaces, setActiveWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showWSPicker, setShowWSPicker] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
  }>({
    visible: false,
    type: "info",
    title: "",
    description: "",
  });

  const showAlertDialog = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description: string
  ) => {
    setDialogConfig({ visible: true, type, title, description });
  };

  useEffect(() => {
    if (user?.id) {
      fetchWorkspaces(user.id).then(() => {
        setLoading(false);
      });
      fetchDashboardData();
      fetchNotifications();
      fetchInvites();
      checkPendingInvite(user.id);
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const { socket } = useSocialStore();

  useEffect(() => {
    if (socket) {
      const handleNotif = () => {
        fetchNotifications();
      };
      socket.on("notification", handleNotif);
      socket.on("friend_request", handleNotif);
      socket.on("friend_accept", handleNotif);
      return () => {
        socket.off("notification", handleNotif);
        socket.off("friend_request", handleNotif);
        socket.off("friend_accept", handleNotif);
      };
    }
  }, [socket]);

  const checkPendingInvite = async (userId: string) => {
    try {
      let token: string | null = null;
      let action: string | null = null;

      if (Platform.OS === 'web') {
        token = localStorage.getItem("pending_invite_token");
        action = localStorage.getItem("pending_invite_action");
      } else {
        token = await SecureStore.getItemAsync("pending_invite_token");
        action = await SecureStore.getItemAsync("pending_invite_action");
      }

      if (token) {
        // Clear immediately to prevent double submission
        if (Platform.OS === 'web') {
          localStorage.removeItem("pending_invite_token");
          localStorage.removeItem("pending_invite_action");
        } else {
          await SecureStore.deleteItemAsync("pending_invite_token");
          await SecureStore.deleteItemAsync("pending_invite_action");
        }

        const status = action === 'decline' ? 'declined' : 'accepted';
        
        const res = await fetch(`${BACKEND_URL}/api/workspaces/invitations/respond-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, status, userId })
        });

        if (res.ok) {
          showAlertDialog("success", "Success", `Workspace invitation ${status} successfully!`);
          fetchInvites();
          fetchWorkspaces(userId);
          fetchNotifications();
        }
      }
    } catch (e) {
      console.error("Error checking pending invite:", e);
    }
  };

  const fetchInvites = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/invitations/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvites(data);
      } else {
        setInvites([]);
      }
    } catch (e) {
      setInvites([]);
    }
  };

  const handleInviteResponse = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/invitations/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: user.id })
      });
      if (res.ok) {
        showAlertDialog("success", "Success", `Workspace invitation ${status} successfully.`);
        fetchInvites();
        fetchWorkspaces(user.id);
        fetchNotifications();
      }
    } catch (e) {}
  };

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile/${user.id}`);
      const json = await res.json();
      setProfileData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/notifications/${user.id}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setNotifications(json);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${BACKEND_URL}/api/workspaces/notifications/${user.id}/read`, {
        method: 'POST'
      });
      fetchNotifications();
    } catch (e) {}
  };

  const handleWSChange = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setShowWSPicker(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Initializing FounderOS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- PREMIUM HEADER --- */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Home</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity style={styles.wsSelector} onPress={() => setShowWSPicker(true)}>
                {activeWorkspace?.logo && (activeWorkspace.logo.startsWith("http") || activeWorkspace.logo.startsWith("data:")) ? (
                  <Image source={{ uri: activeWorkspace.logo }} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }} />
                ) : (
                  <Text style={{ fontSize: 24, marginRight: 8 }}>{activeWorkspace?.logo || '🏢'}</Text>
                )}
                <Text style={styles.workspaceTitle} numberOfLines={1}>
                  {activeWorkspace?.name || user?.workspaceName || "AI Workspace"}
                </Text>
                <ChevronRight size={20} color="#111827" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push("/profile")} style={{ marginLeft: 10, marginTop: 4 }}>
                {user?.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
                  <Image source={{ uri: user.avatar }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB" }} />
                ) : (
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {user?.name?.[0] || '👤'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotificationsModal(true)}>
              <Bell size={24} color="#111827" />
              {notifications.filter((n: any) => n.read === 0).length > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* --- PENDING INVITATIONS --- */}
        {Array.isArray(invites) && invites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workspace Invitations</Text>
            {invites.map(invite => (
              <Card key={invite.id} style={styles.inviteCard}>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.inviteTitle}>Join {invite.workspaceName}</Text>
                    <Text style={styles.inviteSub}>{invite.senderName} invited you as {invite.role}</Text>
                 </View>
                 <View style={styles.inviteActions}>
                    <TouchableOpacity style={styles.accBtn} onPress={() => handleInviteResponse(invite.id, 'accepted')}>
                       <CheckCircle2 size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.decBtn} onPress={() => handleInviteResponse(invite.id, 'declined')}>
                       <X size={18} color="#EF4444" />
                    </TouchableOpacity>
                 </View>
              </Card>
            ))}
          </View>
        )}

        {/* --- SYSTEM METRICS --- */}
        <View style={styles.section}>
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <View style={[styles.mIconBox, { backgroundColor: '#EEF2FF' }]}><Zap size={20} color="#4F46E5" /></View>
              <View>
                <Text style={styles.mVal}>{profileData?.stats?.activeAgents || "8"}</Text>
                <Text style={styles.mLabel}>Active Agents</Text>
              </View>
            </Card>
            <Card style={styles.metricCard}>
              <View style={[styles.mIconBox, { backgroundColor: '#F0FDF4' }]}><Activity size={20} color="#10B981" /></View>
              <View>
                <Text style={styles.mVal}>{profileData?.stats?.projectsCreated || "0"}</Text>
                <Text style={styles.mLabel}>Running Units</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* --- AGENT ACTIVITY LOG --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Terminal size={18} color="#111827" />
            <Text style={styles.sectionTitle}>Intelligence Feed</Text>
          </View>
          <View style={styles.feedList}>
            {(profileData?.activity?.length > 0 ? profileData.activity : [
              { type: 'founder', description: 'OS Core Synchronized', createdAt: new Date() },
              { type: 'research', description: 'Industry signals analyzed', createdAt: new Date() },
              { type: 'coding', description: 'MVP Architecture Provisioned', createdAt: new Date() },
            ]).slice(0, 5).map((log: any, i: number) => {
              const AgentMeta = (AGENT_CONFIG as any)[log.type] || AGENT_CONFIG.founder;
              const AgentIcon = ICON_MAP[AgentMeta?.iconName] || Bot;
              return (
                <Animated.View key={i} entering={FadeInDown.delay(100 * i)} style={styles.feedItem}>
                  <View style={[styles.feedIcon, { backgroundColor: (AgentMeta?.color || '#111827') + '15' }]}>
                    <AgentIcon size={14} color={AgentMeta?.color || '#111827'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedText}>
                      <Text style={{ fontWeight: '800', color: '#111827' }}>{AgentMeta?.label}:</Text> {log.description}
                    </Text>
                  </View>
                  <Text style={styles.feedTime}>just now</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* --- QUICK COMMANDS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Operations</Text>
          <View style={styles.launchGrid}>
            <TouchableOpacity style={styles.launchCard} onPress={() => router.push("/chat")}>
              <View style={[styles.launchIcon, { backgroundColor: '#F5F3FF' }]}><BrainCircuit size={22} color="#7C3AED" /></View>
              <Text style={styles.launchLabel}>Workspace</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.launchCard} onPress={() => router.push("/find")}>
              <View style={[styles.launchIcon, { backgroundColor: '#F0FDFA' }]}><MessageSquare size={22} color="#0D9488" /></View>
              <Text style={styles.launchLabel}>Find</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.launchCard} onPress={() => router.push("/startup/create")}>
              <View style={[styles.launchIcon, { backgroundColor: '#FFF7ED' }]}><Plus size={22} color="#EA580C" /></View>
              <Text style={styles.launchLabel}>New Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SYSTEM HEALTH --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Integrity</Text>
          <Card style={styles.healthCard}>
             <View style={styles.healthItem}>
                <View style={styles.healthIndicator} />
                <Text style={styles.healthText}>Neural Engine: <Text style={{ fontWeight: '800' }}>Optimal</Text></Text>
             </View>
             <View style={styles.healthItem}>
                <View style={styles.healthIndicator} />
                <Text style={styles.healthText}>Agent Sync: <Text style={{ fontWeight: '800' }}>Active</Text></Text>
             </View>
             <View style={styles.healthItem}>
                <View style={[styles.healthIndicator, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.healthText}>Cloud Uptime: <Text style={{ fontWeight: '800' }}>99.9%</Text></Text>
             </View>
             <View style={styles.healthItem}>
                <View style={[styles.healthIndicator, { backgroundColor: '#A855F7' }]} />
                <Text style={styles.healthText}>Memory Store: <Text style={{ fontWeight: '800' }}>Connected</Text></Text>
             </View>
          </Card>
        </View>

      </ScrollView>

      {/* Workspace Selection */}
      <Modal visible={showWSPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowWSPicker(false)}>
           <Animated.View entering={FadeInDown} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Switch OS Instance</Text>
                <TouchableOpacity onPress={() => setShowWSPicker(false)}><X size={20} color="#111827" /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {workspaces.map(ws => (
                  <TouchableOpacity key={ws.id} style={styles.wsOption} onPress={() => handleWSChange(ws)}>
                    <View style={styles.wsIconSmall}>
                      {ws.logo && (ws.logo.startsWith("http") || ws.logo.startsWith("data:")) ? (
                        <Image source={{ uri: ws.logo }} style={{ width: 44, height: 44, borderRadius: 12 }} />
                      ) : (
                        <Text style={styles.wsIconTextSmall}>{ws.logo || ws.name[0]}</Text>
                      )}
                    </View>
                    <Text style={styles.wsOptionText}>{ws.name}</Text>
                    {activeWorkspace?.id === ws.id && <CheckCircle2 size={18} color="#10B981" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.addWSBtn} onPress={() => { setShowWSPicker(false); router.push("/startup/create-workspace"); }}>
                 <Plus size={20} color="#111827" />
                 <Text style={styles.addWSText}>Create New Workspace</Text>
              </TouchableOpacity>
           </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Drawer Modal */}
      <Modal visible={showNotificationsModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowNotificationsModal(false)}
        >
          <Animated.View entering={FadeInDown} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Executive Alerts</Text>
                <Text style={styles.modalSubtitle}>Recent workspace updates</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={styles.closeBtn}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: 10 }} />
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '700' }}>Your feed is completely clear</Text>
                </View>
              ) : (
                notifications.map((n: any) => {
                  const matchingInvite = Array.isArray(invites) ? invites.find(invite => invite.workspaceId === n.workspaceId) : null;
                  return (
                    <View 
                      key={n.id} 
                      style={[
                        styles.notifItem, 
                        n.read === 0 && { borderLeftColor: '#4F46E5', borderLeftWidth: 3, backgroundColor: '#F9FAFB' }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.notifItemTitle, n.read === 0 && { fontWeight: '900' }]}>{n.title}</Text>
                        <Text style={styles.notifItemText}>{n.message}</Text>
                        
                        {n.title === "Workspace Invitation" && matchingInvite && (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 }}>
                            <TouchableOpacity 
                              style={{ 
                                backgroundColor: '#111827', 
                                paddingHorizontal: 12, 
                                paddingVertical: 6, 
                                borderRadius: 8, 
                                flexDirection: 'row', 
                                alignItems: 'center',
                                gap: 4 
                              }} 
                              onPress={() => {
                                setShowNotificationsModal(false);
                                handleInviteResponse(matchingInvite.id, 'accepted');
                              }}
                            >
                              <CheckCircle2 size={14} color="#fff" />
                              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={{ 
                                backgroundColor: '#fff', 
                                borderWidth: 1, 
                                borderColor: '#E5E7EB', 
                                paddingHorizontal: 12, 
                                paddingVertical: 6, 
                                borderRadius: 8, 
                                flexDirection: 'row', 
                                alignItems: 'center',
                                gap: 4 
                              }} 
                              onPress={() => {
                                handleInviteResponse(matchingInvite.id, 'declined');
                              }}
                            >
                              <X size={14} color="#EF4444" />
                              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <Text style={styles.notifItemTime}>
                          {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {notifications.filter((n: any) => n.read === 0).length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleMarkNotificationsRead}>
                <CheckCircle2 size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.clearBtnText}>Mark All as Read</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Dialog
        visible={dialogConfig.visible}
        onClose={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
        type={dialogConfig.type}
        title={dialogConfig.title}
        description={dialogConfig.description}
      />
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 150 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, marginBottom: 28, gap: 16 },
  greeting: { fontSize: 11, color: "#9CA3AF", fontWeight: "900", textTransform: 'uppercase', letterSpacing: 2 },
  wsSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  workspaceTitle: { fontSize: 28, fontWeight: "900", color: "#111827", flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },
  liveBadge: { backgroundColor: "#111827", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  liveBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },

  section: { paddingHorizontal: 24, marginBottom: 36 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#111827", textTransform: 'uppercase', letterSpacing: 1.5 },

  inviteCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  inviteTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  inviteSub: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  inviteActions: { flexDirection: 'row', gap: 8 },
  accBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  decBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },

  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24 },
  mIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mVal: { fontSize: 20, fontWeight: '900', color: '#111827' },
  mLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700' },

  feedList: { gap: 12 },
  feedItem: { flexDirection: 'row', gap: 16, alignItems: 'center', padding: 18, backgroundColor: '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  feedIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  feedText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  feedTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '900' },

  launchGrid: { flexDirection: 'row', gap: 12 },
  launchCard: { flex: 1, padding: 24, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', gap: 14 },
  launchIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  launchLabel: { fontSize: 13, fontWeight: '900', color: '#111827' },

  healthCard: { padding: 20, gap: 12, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6' },
  healthItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  healthText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 28, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  wsOption: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wsIconSmall: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  wsIconTextSmall: { color: '#fff', fontWeight: '900', fontSize: 18 },
  wsOptionText: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  addWSBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  addWSText: { fontSize: 16, fontWeight: '900', color: '#111827' },
  notifItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', gap: 12, alignItems: 'center' },
  notifItemTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  notifItemText: { fontSize: 12, color: '#4B5563', marginTop: 4, lineHeight: 18, fontWeight: '500' },
  notifItemTime: { fontSize: 10, color: '#9CA3AF', marginTop: 6, fontWeight: '700' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#EEF2FF', borderRadius: 16, marginTop: 12 },
  clearBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
});
