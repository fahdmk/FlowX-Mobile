import { Stack, useRouter } from "expo-router"
import { StyleSheet, TextInput, Image, View, TouchableOpacity, Alert } from "react-native"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { useState } from "react"
import supabase from "../Config/SuperbaseClient"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }
  
    try {
      setLoading(true)
      console.log("📩 Attempting login for:", email)
  
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      if (authError || !authData.session) {
        console.error("❌ Auth Error:", authError)
        throw authError || new Error("Failed to sign in")
      }
  
      const userEmail = authData.session.user.email
      console.log("🔐 Auth success. Email:", userEmail)
  
      // Get user ID from auth_users
      const { data: userData, error: userError } = await supabase
        .from("auth_users")
        .select("id")
        .eq("email", userEmail)
  
      console.log("📦 auth_users response:", userData)
  
      if (userError) {
        console.error("❌ Error fetching user ID from auth_users:", userError)
        throw userError
      }
  
      if (!userData || userData.length !== 1) {
        throw new Error(
          `auth_users query failed: expected 1 row, got ${userData?.length || 0}. Check the database.`
        )
      }
  
      const userId = userData[0].id
  
      // Get profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
  
      console.log("📦 profiles response:", profileData)
  
      if (profileError) {
        console.error("❌ Error fetching profile:", profileError)
        throw profileError
      }
  
      if (!profileData || profileData.length !== 1) {
        throw new Error(
          `profiles query failed: expected 1 row, got ${profileData?.length || 0}. Check the database.`
        )
      }
  
      const profile = profileData[0]
  
      console.log("✅ Login successful:", { userId, userEmail, profile })
  
      // Create a full_name from first_name and last_name if available
      const fullName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.username || "";
      
      // Pass all relevant profile data to the tabs
      router.replace({
        pathname: "/(tabs)",
        params: {
          id: userId,
          email: userEmail,
          full_name: fullName,
          avatar_url: profile.avatar_url || "",
          username: profile.username || "",
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          birthday: profile.birthday || "",
          phone_number: profile.phone_number || "",
          role_id: profile.role_id || "",
          profile_id: profile.profile_id || "",
          // Add any other fields you need
        },
      })
    } catch (error: any) {
      console.error("❌ Login failed:", error.message)
      Alert.alert("Login Failed", error.message)
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <>
      <Stack.Screen options={{ title: "Login" }} />
      <ThemedView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity activeOpacity={0.7} onPress={handleEmailLogin} disabled={loading}>
          <View style={[styles.button, loading && styles.buttonDisabled]}>
            <ThemedText style={styles.buttonText}>{loading ? "Loading..." : "Login"}</ThemedText>
          </View>
        </TouchableOpacity>
      </ThemedView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#FFFFFF", // White background
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40, // Increased bottom margin for more space
  },
  logo: {
    width: 250, // Increased from 100 to 150
    height: 250, // Increased from 100 to 150
    resizeMode: "contain",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000000", // Changed to black
    padding: 12,
    marginBottom: 16, // Slightly increased for better spacing
    borderRadius: 8,
    fontSize: 16,
    color: "#000000", // Changed to black
    backgroundColor: "#FFFFFF", // White background
  },
  button: {
    backgroundColor: "#000000", // Changed from blue to black
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8, // Added some top margin
  },
  buttonDisabled: {
    backgroundColor: "#666666", // Changed to a dark gray
  },
  buttonText: {
    color: "#FFFFFF", // White text
    fontWeight: "bold",
    fontSize: 16,
  },
})