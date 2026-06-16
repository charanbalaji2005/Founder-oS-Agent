import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function StartupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgPrimary },
        animation: "slide_from_right",
      }}
    />
  );
}
