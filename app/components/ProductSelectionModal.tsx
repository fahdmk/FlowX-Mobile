import type React from "react"
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Modal } from "react-native"
import { Button, Searchbar } from "react-native-paper"
import { AntDesign } from "@expo/vector-icons"
import type { Product } from "../types/Product"
import ProductCard from "./ProductCard"
import Pagination from "./Pagination"

interface ProductSelectionModalProps {
  visible: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  modalCurrentPage: number
  paginatedFilteredProducts: Product[]
  filteredProducts: Product[]
  setModalCurrentPage: (page: number) => void
  tempSelectedProducts: number[]
  productQuantities: Record<number, number | string>
  setProductQuantities: React.Dispatch<React.SetStateAction<Record<number, number | string>>>
  handleCheckboxChange: (itemId: number) => void
  handleConfirmSelection: () => void
  itemsPerPage: number
}

const ProductSelectionModal = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  modalCurrentPage,
  paginatedFilteredProducts,
  filteredProducts,
  setModalCurrentPage,
  tempSelectedProducts,
  productQuantities,
  setProductQuantities,
  handleCheckboxChange,
  handleConfirmSelection,
  itemsPerPage,
}: ProductSelectionModalProps) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Products</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Searchbar
            placeholder="Search products..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <Pagination
            currentPage={modalCurrentPage}
            totalItems={filteredProducts.length}
            onPageChange={setModalCurrentPage}
            itemsPerPage={itemsPerPage}
          />

          <ScrollView style={styles.modalScrollView}>
            {paginatedFilteredProducts.map((item) => (
              <ProductCard
                key={item.product_id}
                item={item}
                showCheckbox={true}
                isSelected={tempSelectedProducts.includes(item.product_id)}
                productQuantities={productQuantities}
                setProductQuantities={setProductQuantities}
                handleCheckboxChange={handleCheckboxChange}
              />
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button
              mode="contained"
              onPress={handleConfirmSelection}
              style={styles.confirmButton}
              labelStyle={{ color: "black" }}
            >
              Confirm Selection
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
    backgroundColor: "#efefef",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  confirmButton: {
    backgroundColor: "#eaeaea",
    borderColor: "#2c2c2c",
    borderWidth: 2,
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
})

export default ProductSelectionModal
