
import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native"
import { Calendar } from "react-native-calendars"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"


const SAMPLE_SHIFTS = [
  { id: 1, date: "2025-04-16", startTime: "09:00", endTime: "17:00" },
  { id: 2, date: "2025-04-18", startTime: "12:00", endTime: "20:00" },
  { id: 3, date: "2025-04-20", startTime: "08:00", endTime: "16:00"},
]

const SAMPLE_AVAILABILITY = [
  { id: 1, date: "2025-04-22", startTime: "09:00", endTime: "18:00" },
  { id: 2, date: "2025-04-23", startTime: "10:00", endTime: "19:00" },
]

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [modalVisible, setModalVisible] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    date: selectedDate,
    startTime: "09:00",
    endTime: "17:00",
  })
  const [shifts, setShifts] = useState(SAMPLE_SHIFTS)
  const [availability, setAvailability] = useState(SAMPLE_AVAILABILITY)
  const [activeTab, setActiveTab] = useState("shifts")

  // Generate marked dates for the calendar
  const getMarkedDates = () => {
    const markedDates: { [key: string]: { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string } } = {}

    shifts.forEach((shift) => {
      markedDates[shift.date] = {
        marked: true,
        dotColor: "#4CAF50",
        selected: shift.date === selectedDate,
        selectedColor: shift.date === selectedDate ? "rgba(76, 175, 80, 0.2)" : undefined,
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

  const addAvailability = () => {
    const newAvailability = {
      id: availability.length + 1,
      ...availabilityForm,
    }

    setAvailability([...availability, newAvailability])
    setModalVisible(false)
  }

  const getShiftsForSelectedDate = () => {
    return shifts.filter((shift) => shift.date === selectedDate)
  }

  const getAvailabilityForSelectedDate = () => {
    return availability.filter((avail) => avail.date === selectedDate)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <SafeAreaView style={styles.container}>

      <Calendar
        style={styles.calendar}
        theme={{
          todayTextColor: "#4CAF50",
          arrowColor: "#4CAF50",
          dotColor: "#4CAF50",
          selectedDayBackgroundColor: "#4CAF50",
        }}
        markedDates={getMarkedDates()}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
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
          onPress={() => setActiveTab("shifts")}
        >
          <Text style={[styles.tabText, activeTab === "shifts" && styles.activeTabText]}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "availability" && styles.activeTab]}
          onPress={() => setActiveTab("availability")}
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
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.shiftTime}>
                      {shift.startTime} - {shift.endTime}
                    </Text>
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
                <View key={avail.id} style={[styles.shiftCard, styles.availabilityCard]}>
                  <View style={styles.shiftHeader}>
                    <Ionicons name="time-outline" size={20} color="#2196F3" />
                    <Text style={styles.availabilityTime}>
                      {avail.startTime} - {avail.endTime}
                    </Text>
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
                onChangeText={(text) => setAvailabilityForm({ ...availabilityForm, startTime: text })}
                placeholder="09:00"
                keyboardType="default"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                value={availabilityForm.endTime}
                onChangeText={(text) => setAvailabilityForm({ ...availabilityForm, endTime: text })}
                placeholder="17:00"
                keyboardType="default"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={addAvailability}>
                <Text style={styles.saveButtonText}>Save</Text>
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
