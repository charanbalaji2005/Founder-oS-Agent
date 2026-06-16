
import { useEffect } from "react";
import { Tabs, usePathname } from "expo-router";
import { View, StyleSheet, Platform, Text, useWindowDimensions } from "react-native";
import { LayoutDashboard, MessageSquare, Map, Folder, User, Terminal, Cpu } from "lucide-react-native";
import { useSocialStore } from "@/store/social-store";
import { useAuthStore } from "@/store/auth-store";

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Icon
        size={22}
        color={focused ? "#111827" : "#9CA3AF"}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

export default function TabsLayout() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { connectSocket, disconnectSocket, activeConversation } = useSocialStore();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;

  const hideTabs = pathname.includes("/chat") || (pathname.includes("/find") && activeConversation !== null && !isDesktop);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: 80, // Increased height to comfortably fit the icon wrap and text
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          borderRadius: 40, // Increased to perfectly match the 80 height (pill shape)
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          display: hideTabs ? 'none' : 'flex',
          borderStyle: 'solid',
          paddingHorizontal: 10,
          paddingBottom: 15, // Pushes content up to center it
          paddingTop: 10,    // Pushes content down to center it
        },
        tabBarItemStyle: {
          justifyContent: 'center', // Ensures the icon and label sit vertically centered together
          alignItems: 'center',
        },
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "900",
          textTransform: 'uppercase',
          marginTop: 6,
          paddingBottom: Platform.OS === 'web' ? 5 : 0
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Cpu} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Workspace",
          tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: "Find",
          tabBarIcon: ({ focused }) => <TabIcon Icon={MessageSquare} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Ventures",
          tabBarIcon: ({ focused }) => <TabIcon Icon={Folder} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "System",
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // Removed marginTop: 5 so that the element sits perfectly centered
  },
  iconActive: {
    backgroundColor: "#F3F4F6",
  },
});

