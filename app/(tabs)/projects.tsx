import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus, Rocket, ArrowUpRight, Bot, Inbox
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card } from "@/components/ui/Card";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { BACKEND_URL } from "@/constants";

export default function VenturesScreen() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [user?.id]);

  const fetchProjects = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/user/${user.id}`);
      const workspaces = await res.json();

      const res2 = await fetch(`${BACKEND_URL}/api/projects`);
      const data = await res2.json();

      const userProjects = (data.projects || []).filter((p: any) => p.userId === user.id);
      setProjects(userProjects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Your Ventures</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push("/startup/create")}>
          <Plus size={20} color="#fff" />
          <Text style={styles.newBtnText}>New Venture</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {projects.length > 0 ? projects.map((v, i) => (
          <Animated.View key={v.id} entering={FadeInDown.delay(i * 100)}>
            <Card style={styles.ventureCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}><Rocket size={20} color="#111827" /></View>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{v.status}</Text></View>
              </View>

              <Text style={styles.ventureName}>{v.title}</Text>
              <Text style={styles.ventureIndustry}>{v.industry} · Collaborative Workspace</Text>

              <View style={styles.progressBox}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Launch Readiness</Text>
                  <Text style={styles.progressVal}>{v.status === 'complete' ? '100%' : '20%'}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: v.status === 'complete' ? '100%' : '20%' }]} />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.teamAvatars}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>{user?.name?.[0] || 'U'}</Text>
                  </View>
                  <Text style={styles.teamCount}>+8 AI agents</Text>
                </View>
                <TouchableOpacity style={styles.openBtn} onPress={() => router.push(`/projects/${v.id}` as any)}>
                  <ArrowUpRight size={18} color="#111827" />
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        )) : (
          <View style={styles.emptyState}>
            <Inbox size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>No ventures discovered yet.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/startup/create")}>
              <Text style={styles.emptyBtnText}>Launch First Venture</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  scroll: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 150 },
  ventureCard: { padding: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#10B981', textTransform: 'uppercase' },

  ventureName: { fontSize: 18, fontWeight: '900', color: '#111827' },
  ventureIndustry: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 4 },

  progressBox: { marginTop: 24, marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  progressVal: { fontSize: 12, fontWeight: '900', color: '#111827' },
  progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#111827' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 },
  teamAvatars: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#111827', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: '900' },
  teamCount: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginLeft: 12 },
  openBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  emptyBtn: { backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: '#fff', fontWeight: '800' },
});
