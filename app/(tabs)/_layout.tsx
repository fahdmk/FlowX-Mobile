import { Tabs, useLocalSearchParams } from "expo-router";
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
  // Get user data from route params
  const params = useLocalSearchParams();
  
  // Create a complete userData object with all fields
  const userData = {
    id: params.id as string,
    email: params.email as string,
    full_name: params.full_name as string,
    avatar_url: params.avatar_url as string,
    username: params.username as string,
    first_name: params.first_name as string,
    last_name: params.last_name as string,
    birthday: params.birthday as string,
    phone_number: params.phone_number as string,
    role_id: params.role_id as string,
    profile_id: params.profile_id as string,
    // Add any other fields you need
  };
  
  console.log("Complete user data in TabLayout:", userData);

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
        initialParams={userData}
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
        initialParams={userData}
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
        initialParams={userData}
      />
    </Tabs>
  );
}