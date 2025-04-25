"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native"
import { Calendar } from "react-native-calendars"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import supabase from "../../Config/SuperbaseClient"

// Define types for our schedule data
type Schedule = {
  schedule_id: number
  profile_id: string
  store_id: string
  shift_start: string
  shift_end: string
  schedule_type: string
  status: string
  date?: string // Derived field
  startTime?: string // Derived field
  endTime?: string // Derived field
}

type Availability = {
  id: number
  date: string
  startTime: string
  endTime: string
}

// Define the user data structure based on what we're passing from Login
interface UserData {
  id: string
  email: string
  full_name: string
  avatar_url: string
  username: string
  first_name: string
  last_name: string
  birthday: string
  phone_number: string
  role_id: string
  profile_id: string
}

export default function Schedule() {
  // Get user data from route params instead of props
  const params = useLocalSearchParams();
  
  // Create userData object from route params
  const userData: UserData = {
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
  };
  
  // Log the userData to the console

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [modalVisible, setModalVisible] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    date: selectedDate,
    startTime: "09:00",
    endTime: "17:00",
  })
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [activeTab, setActiveTab] = useState("shifts")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch schedules from Supabase with detailed logging
  const fetchSchedules = async () => {
    // Use profile_id from userData if available, otherwise fall back to id
    const profileId = userData.profile_id || userData.id;
    
    if (!profileId) {
      console.error("❌ Schedule: No profile ID available")
      setIsLoading(false)
      setError("User profile not found")
      return
    }
  
    try {
      setIsLoading(true)
      setError(null)
  
      console.log("📅 Schedule: Fetching schedules for profile ID:", profileId)
      // Updated query format as requested
      let { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')  // Make sure to select all fields, not just profile_id
        .eq("profile_id", profileId)
  
      if (error) {
        console.error("❌ Schedule: Error fetching schedules:", error)
        setError("Failed to load schedules")
        throw error
      }
  
      const processedSchedules =
        schedules?.map((schedule: Schedule) => {
          const shiftStartDate = new Date(schedule.shift_start)
          const date = shiftStartDate.toISOString().split("T")[0]
  
          const startTime = shiftStartDate.toTimeString().substring(0, 5)
          const shiftEndDate = new Date(schedule.shift_end)
          const endTime = shiftEndDate.toTimeString().substring(0, 5)
  
          return { ...schedule, date, startTime, endTime }
        }) || []
  
      console.log(`📅 Schedule: Fetched ${processedSchedules.length} schedules`)
      setSchedules(processedSchedules)
    } catch (err) {
      console.error("❌ Schedule: Failed to fetch schedules:", err)
      setError("An error occurred while loading your schedules")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if we have a valid user ID before fetching schedules
    if (userData.id) {
      fetchSchedules()
    } else {
      setIsLoading(false)
      setError("User information not available")
    }
  }, [userData.id])

  // Generate marked dates for the calendar
  const getMarkedDates = () => {
    const markedDates: {
      [key: string]: { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
    } = {}

    schedules.forEach((shift) => {
      if (!shift.date) return

      markedDates[shift.date] = {
        marked: true,
        dotColor: shift.schedule_type === "availability" ? "#2196F3" : "#4CAF50",
        selected: shift.date === selectedDate,
        selectedColor:
          shift.date === selectedDate
            ? shift.schedule_type === "availability"
              ? "rgba(33, 150, 243, 0.2)"
              : "rgba(76, 175, 80, 0.2)"
            : undefined,
      }
    })

    availability.forEach((avail) => {
      if (markedDates[avail.date]) {
        markedDates[avail.date].dotColor = "#2196F3"
      } else {
        markedDates[avail.date] = {
          marked: true,
          dotColor: "#2196F3",
          selected: avail.date === selectedDate,
          selectedColor: avail.date === selectedDate ? "rgba(33, 150, 243, 0.2)" : undefined,
        }
      }
    })

    // If selected date is not already marked
    if (!markedDates[selectedDate]) {
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: "rgba(200, 200, 200, 0.2)",
      }
    }

    return markedDates
  }

  const addAvailability = async () => {
    // Use profile_id from userData if available, otherwise fall back to id
    const profileId = userData.profile_id || userData.id;
    
    if (!profileId) {
      console.error("❌ Schedule: No profile ID available, cannot add availability")
      setError("You must be logged in to add availability")
      return
    }

    try {
      setIsLoading(true)

      // Convert form data to ISO format for database
      const startDateTime = new Date(`${availabilityForm.date}T${availabilityForm.startTime}:00`)
      const endDateTime = new Date(`${availabilityForm.date}T${availabilityForm.endTime}:00`)

      const newSchedule = {
        profile_id: profileId,
        store_id: "default", // You might want to change this based on your app's logic
        shift_start: startDateTime.toISOString(),
        shift_end: endDateTime.toISOString(),
        schedule_type: "availability",
        status: "active",
      }

      console.log("📅 Schedule: Inserting new availability:", newSchedule)
      const { data, error } = await supabase.from("schedules").insert(newSchedule).select()

      if (error) {
        console.error("❌ Schedule: Error adding availability:", error)
        throw error
      }

      console.log("✅ Schedule: Availability added successfully")

      // Refresh schedules
      const { data: updatedSchedules, error: fetchError } = await supabase
        .from("schedules")
        .select("*")
        .eq("profile_id", profileId)

      if (fetchError) {
        console.error("❌ Schedule: Error refreshing schedules:", fetchError)
        throw fetchError
      }

      // Process the data to format dates and times
      const processedSchedules =
        updatedSchedules?.map((schedule: Schedule) => {
          // Extract date from shift_start (assuming ISO format)
          const shiftStartDate = new Date(schedule.shift_start)
          const date = shiftStartDate.toISOString().split("T")[0]

          // Format times (HH:MM)
          const startTime = shiftStartDate.toTimeString().substring(0, 5)
          const shiftEndDate = new Date(schedule.shift_end)
          const endTime = shiftEndDate.toTimeString().substring(0, 5)

          return {
            ...schedule,
            date,
            startTime,
            endTime,
          }
        }) || []

      setSchedules(processedSchedules)
      setModalVisible(false)
    } catch (err) {
      console.error("❌ Schedule: Failed to add availability:", err)
      setError("Failed to add availability")
    } finally {
      setIsLoading(false)
    }
  }

  const getShiftsForSelectedDate = () => {
    const shifts = schedules.filter((shift) => shift.date === selectedDate && shift.schedule_type !== "availability")
    return shifts
  }

  const getAvailabilityForSelectedDate = () => {
    const avail = schedules.filter((shift) => shift.date === selectedDate && shift.schedule_type === "availability")
    return avail
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (isLoading && schedules.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close-circle" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <Calendar
        style={styles.calendar}
        theme={{
          todayTextColor: "#4CAF50",
          arrowColor: "#4CAF50",
          dotColor: "#4CAF50",
          selectedDayBackgroundColor: "#4CAF50",
        }}
        markedDates={getMarkedDates()}
        onDayPress={(day: { dateString: string }) => {
          setSelectedDate(day.dateString)
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
          <Text style={styles.legendText}>Shifts</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#2196F3" }]} />
          <Text style={styles.legendText}>Availability</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "shifts" && styles.activeTab]}
          onPress={() => {
            setActiveTab("shifts")
          }}
        >
          <Text style={[styles.tabText, activeTab === "shifts" && styles.activeTabText]}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "availability" && styles.activeTab]}
          onPress={() => {
            setActiveTab("availability")
          }}
        >
          <Text style={[styles.tabText, activeTab === "availability" && styles.activeTabText]}>My Availability</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.dateHeader}>{formatDate(selectedDate)}</Text>

        {activeTab === "shifts" ? (
          <>
            {getShiftsForSelectedDate().length > 0 ? (
              getShiftsForSelectedDate().map((shift) => (
                <View key={shift.schedule_id} style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.shiftTime}>
                      {shift.startTime} - {shift.endTime}
                    </Text>
                  </View>
                  <View style={styles.shiftDetails}>
                    <Text style={styles.shiftStatus}>Status: {shift.status}</Text>
                    {shift.store_id && <Text style={styles.shiftStore}>Store: {shift.store_id}</Text>}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>No shifts scheduled for this day</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {getAvailabilityForSelectedDate().length > 0 ? (
              getAvailabilityForSelectedDate().map((avail) => (
                <View key={avail.schedule_id} style={[styles.shiftCard, styles.availabilityCard]}>
                  <View style={styles.shiftHeader}>
                    <Ionicons name="time-outline" size={20} color="#2196F3" />
                    <Text style={styles.availabilityTime}>
                      {avail.startTime} - {avail.endTime}
                    </Text>
                  </View>
                  <View style={styles.shiftDetails}>
                    <Text style={styles.availabilityStatus}>Status: {avail.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>No availability set for this day</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {activeTab === "availability" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setAvailabilityForm({
              date: selectedDate,
              startTime: "09:00",
              endTime: "17:00",
            })
            setModalVisible(true)
          }}
          disabled={isLoading}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Availability</Text>
            <Text style={styles.modalDate}>{formatDate(availabilityForm.date)}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={availabilityForm.startTime}
                onChangeText={(text) => {
                  setAvailabilityForm({ ...availabilityForm, startTime: text })
                }}
                placeholder="09:00"
                keyboardType="default"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                value={availabilityForm.endTime}
                onChangeText={(text) => {
                  setAvailabilityForm({ ...availabilityForm, endTime: text })
                }}
                placeholder="17:00"
                keyboardType="default"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false)
                }}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={addAvailability}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#f44336",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "white",
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  legend: {
    flexDirection: "row",
    padding: 10,
    justifyContent: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  shiftCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  availabilityCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#4CAF50",
  },
  availabilityTime: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#2196F3",
  },
  shiftDetails: {
    marginLeft: 28,
  },
  shiftStatus: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  shiftStore: {
    fontSize: 14,
    color: "#666",
  },
  availabilityStatus: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: "#999",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  modalDate: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  saveButton: {
    backgroundColor: "#2196F3",
  },
  cancelButtonText: {
    color: "#666",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
})