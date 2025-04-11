import React from "react"
import { StyleSheet, View, TouchableOpacity, Text } from "react-native"
import { AntDesign } from "@expo/vector-icons"

interface PaginationProps {
  currentPage: number
  totalItems: number
  onPageChange: (page: number) => void
  itemsPerPage: number
}

const Pagination = ({ currentPage, totalItems, onPageChange, itemsPerPage }: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalItems <= itemsPerPage) return null

  return (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
      >
        <AntDesign name="left" size={20} color={currentPage === 1 ? "#999" : "#333"} />
      </TouchableOpacity>

      <Text style={styles.paginationText}>
        Page {currentPage} of {totalPages}
      </Text>

      <TouchableOpacity
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
      >
        <AntDesign name="right" size={20} color={currentPage === totalPages ? "#999" : "#333"} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  paginationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
})

export default Pagination
