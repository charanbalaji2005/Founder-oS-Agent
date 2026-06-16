import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Image, Switch,
  ActivityIndicator, useWindowDimensions,
  TextInput, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { BACKEND_URL } from "@/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  Shield, LogOut, Edit3, Mail, Camera, AtSign, Search, ChevronRight, User
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

export default function CollaborativeProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    workspaceName: "",
    industry: "",
    bio: "",
    phoneNumber: "",
    timezone: "",
    avatar: "",
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile/${user.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setData(json);
      if (json.user) {
        setFormData({
          name: json.user.name || "",
          companyName: json.user.companyName || "",
          workspaceName: json.user.workspaceName || "",
          industry: json.user.industry || "",
          bio: json.user.bio || "",
          phoneNumber: json.user.phoneNumber || "",
          timezone: json.user.timezone || "GMT+0",
          avatar: json.user.avatar || "",
        });
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setFormData({ ...formData, avatar: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      updateUser(json.user);
      await useWorkspaceStore.getState().fetchWorkspaces(user.id);
      setEditMode(false);
      showAlertDialog("success", "Success", "Operating System profile updated.");
      fetchProfile();
    } catch (err: any) {
      showAlertDialog("error", "Error", err.message || "Cloud synchronization failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* --- OS HEADER --- */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={editMode ? pickAvatar : undefined}>
            {formData.avatar ? (
              <Image source={{ uri: formData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{formData.name?.[0]}</Text></View>
            )}
            {editMode && (
              <View style={styles.cameraIcon}><Camera size={14} color="#fff" /></View>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{formData.name}</Text>
            <View style={styles.roleBadge}><Text style={styles.roleText}>System Owner</Text></View>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, editMode && { backgroundColor: '#111827' }]}
            onPress={() => setEditMode(!editMode)}
          >
            <Edit3 size={20} color={editMode ? "#fff" : "#111827"} />
          </TouchableOpacity>
        </Animated.View>

        {/* --- MAIN INFO CARD --- */}
        <View style={styles.section}>
          <Card style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={formData.name}
                editable={editMode}
                onChangeText={(v) => setFormData({...formData, name: v})}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username (ID)</Text>
              <View style={[styles.input, styles.inputLocked]}>
                <AtSign size={16} color="#9CA3AF" />
                <Text style={styles.lockedText}>{data?.user?.username || user?.username || 'user'}</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Primary Email</Text>
              <View style={[styles.input, styles.inputLocked]}>
                <Mail size={16} color="#9CA3AF" />
                <Text style={styles.lockedText}>{data?.user?.email || user?.email || 'email'}</Text>
                <Shield size={12} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </View>
            </View>

            <View style={styles.row}>
               <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Company</Text>
                  <TextInput
                    style={[styles.input, !editMode && styles.inputDisabled]}
                    placeholder="Enter company"
                    value={formData.companyName}
                    editable={editMode}
                    onChangeText={(v) => setFormData({...formData, companyName: v})}
                  />
               </View>
               <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Workspace</Text>
                  <TextInput
                    style={[styles.input, !editMode && styles.inputDisabled]}
                    placeholder="Enter workspace"
                    value={formData.workspaceName}
                    editable={editMode}
                    onChangeText={(v) => setFormData({...formData, workspaceName: v})}
                  />
               </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Executive Summary / Bio</Text>
              <TextInput
                style={[styles.input, { height: 100 }, !editMode && styles.inputDisabled]}
                multiline
                placeholder="No bio provided"
                value={formData.bio}
                editable={editMode}
                onChangeText={(v) => setFormData({...formData, bio: v})}
              />
            </View>

            {editMode && (
              <Button
                label="Synchronize Changes"
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: 10 }}
              />
            )}
          </Card>
        </View>

        {/* --- GLOBAL DIRECTORY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Operator Directory</Text>
          <Card style={styles.formCard}>
             <View style={styles.searchBar}>
                <Search size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Search usernames..."
                  style={styles.searchInput}
                  onChangeText={async (t) => {
                    if (t.length > 1) {
                       try {
                         const res = await fetch(`${BACKEND_URL}/api/workspaces/search-users?query=${t}`);
                         const d = await res.json();
                         setGlobalUsers(Array.isArray(d) ? d : []);
                       } catch (e) {
                         setGlobalUsers([]);
                       }
                    } else {
                       setGlobalUsers([]);
                    }
                  }}
                />
             </View>
          {Array.isArray(globalUsers) && globalUsers.map(u => (
               <View key={u?.id || Math.random().toString()} style={styles.userRow}>
                  <View style={styles.wsIconSmall}><Text style={styles.wsIconTextSmall}>{u?.name?.[0] || '?'}</Text></View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.userNameSmall}>{u?.name || "Unknown"}</Text>
                     <Text style={styles.userHandle}>{u?.username ? (u.username.startsWith("@") ? u.username : `@${u.username}`) : "@user"} {u?.email ? `(${u.email})` : ""}</Text>
                  </View>
                  <View style={styles.statusDotSmall} />
               </View>
             ))}
          </Card>
        </View>

        {/* --- SECURITY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Protocol</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Shield size={20} color="#111827" />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Two-Step Verification</Text>
                <Text style={styles.settingDesc}>Protect account with email OTP</Text>
              </View>
              <Switch
                value={Boolean(data?.security?.twoFactorEnabled)}
                onValueChange={async (val) => {
                  if (!user?.id) return;
                  try {
                    const res = await fetch(`${BACKEND_URL}/api/users/toggle-2fa`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id, enabled: val })
                    });
                    const resJson = await res.json();
                    if (res.ok) {
                      fetchProfile();
                    } else {
                      showAlertDialog("error", "Error", resJson.error || "Security update failed.");
                    }
                  } catch (e) {
                    console.error("2FA Toggle error:", e);
                    showAlertDialog("error", "Connection Error", "Could not reach the security server.");
                  }
                }}
              />
            </View>
          </Card>
        </View>

        {/* --- SESSION --- */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <LogOut size={22} color="#EF4444" />
            <Text style={styles.dangerBtnText}>Terminate Session</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>FOUNDEROS OS v3.0.0 · CORPORATE EDITION</Text>
      </ScrollView>

      <Dialog
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        type="confirm"
        title="Terminate Session"
        description="Are you sure you want to end your current session? You will need to sign in again to access your workspaces."
        confirmLabel="Terminate"
        cancelLabel="Cancel"
        onConfirm={async () => {
          await logout();
          router.replace("/auth/login");
        }}
      />

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 150 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F3F4F6' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  cameraIcon: { position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, borderRadius: 14, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  headerInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 26, fontWeight: '900', color: '#111827' },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' },
  editBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  formCard: { padding: 20, gap: 20, borderRadius: 24 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 52, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, fontSize: 15, color: '#111827', fontWeight: '600' },
  inputDisabled: { backgroundColor: '#fff', borderColor: 'transparent', paddingHorizontal: 0, height: 'auto' },
  inputLocked: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  lockedText: { fontSize: 15, color: '#6B7280', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 16 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  userNameSmall: { fontSize: 14, fontWeight: '700', color: '#111827' },
  userHandle: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  statusDotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  wsIconSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  wsIconTextSmall: { color: '#fff', fontWeight: '900', fontSize: 14 },

  settingCard: { padding: 20, borderRadius: 24 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  settingLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
  settingDesc: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 60, borderRadius: 20, borderColor: '#FEE2E2', borderWidth: 1, backgroundColor: '#FEF2F2' },
  dangerBtnText: { color: '#EF4444', fontWeight: '900', fontSize: 15 },

  footer: { textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#E5E7EB', marginTop: 20 },
});
