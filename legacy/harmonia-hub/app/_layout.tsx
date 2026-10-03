import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-provider";
import { LibraryProvider } from "@/lib/library-context";
import { PlayerProvider } from "@/lib/player-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { useMemo } from "react";

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const trpcClient = useMemo(() => createTRPCClient(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#08070B" }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LibraryProvider>
              <PlayerProvider>
              <StatusBar style="light" backgroundColor="#121212" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#08070B' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="player"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen name="ceo-dashboard" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="subscription" options={{ headerShown: false }} />
              </Stack>
              </PlayerProvider>
            </LibraryProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
