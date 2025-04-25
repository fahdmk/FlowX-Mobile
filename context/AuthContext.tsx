"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import supabase from "../Config/SuperbaseClient"

type User = {
  id: string
  email: string
  profile?: {
    id: string
    user_id: string
    full_name?: string
    avatar_url?: string
  }
}

type AuthState = {
  user: User | null
  session: any | null
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: "SET_USER"; payload: { user: User; session: any } }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_PROFILE"; payload: any }

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  error: null,
}

const AuthContext = createContext<{
  state: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  googleSignIn: () => Promise<void>
  updateUserProfile: (profileData: any) => Promise<void>
  clearError: () => void
}>({
  state: initialState,
  signIn: async () => {},
  signOut: async () => {},
  googleSignIn: async () => {},
  updateUserProfile: async () => {},
  clearError: async () => {},
})

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log("🔄 Reducer Action:", action)
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isLoading: false,
        error: null,
      }
    case "CLEAR_USER":
      return {
        ...state,
        user: null,
        session: null,
        isLoading: false,
        error: null,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      }
    case "UPDATE_PROFILE":
      return {
        ...state,
        user: state.user ? { ...state.user, profile: action.payload } : null,
      }
    default:
      return state
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    console.log("📌 useEffect: Initializing auth listener and checking user")
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔁 Auth State Change:", event, session)
      if (event === "SIGNED_IN" && session) {
        await fetchUserData(session)
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: "CLEAR_USER" })
      }
    })

    return () => {
      console.log("🧹 Cleaning up auth listener")
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const clearError = () => {
    console.log("❎ Clearing error")
    dispatch({ type: "CLEAR_ERROR" })
  }

  const checkUser = async () => {
    console.log("🔍 Checking current user session")
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        console.log("🔐 Session found, fetching user data")
        await fetchUserData(session)
      } else {
        console.log("🛑 No session, clearing user")
        dispatch({ type: "CLEAR_USER" })
      }
    } catch (error) {
      console.error("❌ checkUser error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to check user session" })
    } finally {
      if (state.isLoading) {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }
  }

  const fetchUserData = async (session: any) => {
    console.log("📦 Fetching user data with session:", session)
    try {
      const userEmail = session.user?.email
      console.log("📧 User email:", userEmail)

      if (!userEmail) {
        throw new Error("Email not found in auth data")
      }

      const { data: userData, error: userError } = await supabase
        .from("auth_users")
        .select("id")
        .eq("email", userEmail)
        .single()

      if (userError) {
        throw userError
      }

      const userId = userData.id
      console.log("🆔 User ID:", userId)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError) {
        throw profileError
      }

      console.log("👤 Profile data:", profile)

      dispatch({
        type: "SET_USER",
        payload: {
          user: {
            id: userId,
            email: userEmail,
            profile,
          },
          session,
        },
      })
      console.log("✅ User set in context")
    } catch (error) {
      console.error("❌ fetchUserData error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to fetch user data" })
    } finally {
      if (state.isLoading) {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in with email:", email)
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "CLEAR_ERROR" })

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      console.log("✅ Sign in successful, session:", authData.session)

      if (authData?.session) {
        await fetchUserData(authData.session)
      }
    } catch (error) {
      console.error("❌ signIn error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to sign in" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const signOut = async () => {
    console.log("🚪 Signing out")
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "CLEAR_ERROR" })

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      console.log("✅ Sign out successful")
      dispatch({ type: "CLEAR_USER" })
    } catch (error) {
      console.error("❌ signOut error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to sign out" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const googleSignIn = async () => {
    console.log("🔐 Attempting Google sign in")
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "CLEAR_ERROR" })

      // Placeholder for real Google logic
      console.warn("⚠️ Google sign in not yet implemented")
    } catch (error) {
      console.error("❌ googleSignIn error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to sign in with Google" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const updateUserProfile = async (profileData: any) => {
    console.log("✏️ Updating user profile with:", profileData)
    try {
      if (!state.user) throw new Error("No user logged in")

      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "CLEAR_ERROR" })

      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", state.user.id)
        .select()
        .single()

      if (error) throw error

      console.log("✅ Profile update successful:", data)
      dispatch({ type: "UPDATE_PROFILE", payload: data })
    } catch (error) {
      console.error("❌ updateUserProfile error:", error)
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to update profile" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        state,
        signIn,
        signOut,
        googleSignIn,
        updateUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
