import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { View, ActivityIndicator } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { loadSession, isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === "auth";
    const inLanding = (segments.length as number) === 0 || (segments[0] as string) === "";

    if (!isAuthenticated && !inAuthGroup && !inLanding) {
      router.replace("/");
    } else if (isAuthenticated && (inAuthGroup || inLanding)) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#ffffff" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="startup" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
