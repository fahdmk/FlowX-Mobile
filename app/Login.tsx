"use client"

import { Stack } from "expo-router"
import { StyleSheet, TextInput, Image, View, TouchableOpacity, Alert } from "react-native"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"
import * as WebBrowser from "expo-web-browser"
import { makeRedirectUri } from "expo-auth-session"
import * as Linking from "expo-linking"
import { Platform } from "react-native"
import supabase from "../Config/SuperbaseClient"

WebBrowser.maybeCompleteAuthSession()

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink)

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])


  const handleDeepLink = async ({ url }: { url: string }) => {
    if (url && url.includes("access_token")) {
      try {
        const access_token = extractTokenFromUrl(url, "access_token")
        const refresh_token = extractTokenFromUrl(url, "refresh_token")

        if (access_token && refresh_token) {
     
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (error) throw error

          router.push("/(tabs)")
        }
      } catch (error) {
        console.error("Deep link auth error:", error)
        Alert.alert("Authentication Error", error instanceof Error ? error.message : "An unknown error occurred")
      }
    }
  }


  const extractTokenFromUrl = (url: string, paramName: string): string | null => {
    const regex = new RegExp(`[?&#]${paramName}=([^&#]*)`)
    const match = regex.exec(url)
    return match ? decodeURIComponent(match[1]) : null
  }

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/(tabs)")
    } catch (error) {
      Alert.alert("Error logging in", error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true)

 
      

      let redirectUrl: string

      if (Platform.OS === "web") {
        redirectUrl = window.location.origin
      } else {
        redirectUrl = makeRedirectUri({
          native: Linking.createURL("supabase-auth-callback"),
          useProxy: __DEV__,
          
        })
      }
      
      console.log("Using redirect URL:", redirectUrl)


      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== "web",
        },
      })

      if (error) throw error

      if (Platform.OS !== "web" && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

        console.log("Auth result type:", result.type)

        if (result.type === "success") {

          if (redirectUrl.includes("auth.expo.io")) {
            const { url } = result
            console.log("Success URL:", url)

            if (url) {
              const { data, error } = await supabase.auth.exchangeCodeForSession(url)

              if (error) throw error

              router.push("/(tabs)")
            }
          }

        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      Alert.alert("Error with Google sign in", error instanceof Error ? error.message : "An unknown error occurred")
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
          autoCorrect={false}
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity activeOpacity={0.7} onPress={handleEmailLogin} disabled={loading}>
          <View style={styles.button}>
            <ThemedText style={styles.buttontext}>{loading ? "Loading..." : "Login"}</ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <ThemedText style={styles.dividerText}>OR</ThemedText>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={handleGoogleLogin} disabled={loading}>
          <View style={styles.googleButton}>
            <Image
              source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }}
              style={styles.googleIcon}
            />
            <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
          </View>
        </TouchableOpacity>

       
      </ThemedView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: "#28282B",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttontext: {
    fontFamily: "bold",
    fontSize: 25,
    color: "#fff",
  },
  logoContainer: {
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginTop: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: "#f2f2f2",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#888",
  },
  googleButton: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#333",
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
})
