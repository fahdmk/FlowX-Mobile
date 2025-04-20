import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Products",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="cube-outline"
              size={size}
              color={focused ? "#000000" : "#D3D3D3"}
            />
          ),
          headerTitle: "Products",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitleStyle: {
            color: "#000000",
          },
          tabBarActiveTintColor: "#000000",
          tabBarInactiveTintColor: "#D3D3D3",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Add Product",
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name="add-circle-outline"
              color={focused ? "#000000" : "#D3D3D3"} 
            />
          ),
          headerTitle: "Add Products",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitleStyle: {
            color: "#000000",
          },
          tabBarActiveTintColor: "#000000",
          tabBarInactiveTintColor: "#D3D3D3",
          
        }}
      />
       <Tabs.Screen
        name="schedule"
        options={{
          title: "My Schedule",
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name="calendar-outline"
              color={focused ? "#000000" : "#D3D3D3"} 
            />
          ),
          headerTitle: "Schedule",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitleStyle: {
            color: "#000000",
          },
          tabBarActiveTintColor: "#000000",
          tabBarInactiveTintColor: "#D3D3D3",
          
        }}
      />
    </Tabs>
  );
}
