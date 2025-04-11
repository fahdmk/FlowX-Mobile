"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView } from "react-native"
import { Button } from "react-native-paper"
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons"
import { Camera } from "expo-camera"
import supabase from "../../Config/SuperbaseClient"
import type { Product } from "../types/Product"


import MainPageProductCard from "../components/MainPageProductCard"
import ProductSelectionModal from "../components/ProductSelectionModal"
import ScannerModal from "../components/ScannerModal"
import Pagination from "../components/Pagination"

export default function ProductsScreen() {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [scannerVisible, setScannerVisible] = useState(false)
  const [tempSelectedProducts, setTempSelectedProducts] = useState<number[]>([])
  const [productQuantities, setProductQuantities] = useState<Record<number, number | string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [modalCurrentPage, setModalCurrentPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])

  const itemsPerPage = 5

  // Mock functions for handleDelete and openEditModal
  const handleDelete = (productId: number) => {
    console.log(`Delete product with ID: ${productId}`)
    // Implement your delete logic here
  }

  const openEditModal = (productId: number) => {
    console.log(`Open edit modal for product with ID: ${productId}`)
    // Implement your edit modal logic here
  }

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name, brand_id, product_length, product_depth, product_width, base_price, qr_code")

      if (error) {
        console.error(error)
      } else {
        const mappedProducts = data?.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          brand_id: item.brand_id,
          product_length: item.product_length,
          product_depth: item.product_depth,
          product_width: item.product_width,
          base_price: item.base_price,
          qr_code: item.qr_code,
          hierarchy_id: null,
          imageUrl: "",
          isInStock: false,
          arrivalDate: "",
        }))
        setProducts(mappedProducts || [])
      }
    }

    fetchProducts()
  }, [])

  const handleSaveChanges = async () => {
    if (selectedProducts.length === 0) {
      alert("No products selected.")
      return
    }

    try {
      // First, get existing records
      const { data: existingRecords, error: checkError } = await supabase
        .from("real_time_inventory")
        .select("inventory_id, store_id, product_id, current_quantity")
        .in("product_id", selectedProducts)
        .eq("store_id", 1)

      if (checkError) {
        console.error("Error checking existing records:", checkError)
        alert("Failed to check existing records. Please try again.")
        return
      }

      const existingMap = new Map(existingRecords?.map((record) => [`${record.store_id}-${record.product_id}`, record]))

      const updatePromises = []
      const insertRows = []

      for (const productId of selectedProducts) {
        const key = `1-${productId}`
        // Parse the quantity here, when needed for database operations
        const quantityValue = productQuantities[productId] || "0"
        const newQuantity = Number.parseInt(String(quantityValue), 10) || 0

        if (existingMap.has(key)) {
          // Update existing record
          const existingRecord = existingMap.get(key)
          updatePromises.push(
            supabase
              .from("real_time_inventory")
              .update({
                current_quantity: existingRecord?.current_quantity + newQuantity,
                last_updated: new Date().toISOString(),
              })
              .eq("inventory_id", existingRecord?.inventory_id),
          )
        } else {
          // Prepare for insertion
          insertRows.push({
            store_id: 1,
            product_id: productId,
            current_quantity: newQuantity,
            last_updated: new Date().toISOString(),
          })
        }
      }

      // Perform all updates
      if (updatePromises.length > 0) {
        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter((result) => result.error)
        if (updateErrors.length > 0) {
          console.error("Errors updating records:", updateErrors)
          alert("Some records could not be updated. Please check the console for details.")
        }
      }

      // Perform insertions
      if (insertRows.length > 0) {
        const { data: insertedData, error: insertError } = await supabase.from("real_time_inventory").insert(insertRows)

        if (insertError) {
          console.error("Error inserting new records:", insertError)
          alert("Some new records could not be inserted. Please check the console for details.")
        }
      }

      alert("Products saved to inventory successfully!")
      setSelectedProducts([]) // Clear selected products after saving
      setProductQuantities({}) // Clear quantities
    } catch (error) {
      console.error("Unexpected error:", error)
      alert("An unexpected error occurred. Please try again.")
    }
  }

  const paginateItems = <T,>(items: T[], page: number): T[] => {
    const startIndex = (page - 1) * itemsPerPage
    return items.slice(startIndex, startIndex + itemsPerPage)
  }

  const getSelectedProducts = () => {
    const selected = products.filter((product) => selectedProducts.includes(product.product_id))
    return paginateItems(selected, currentPage)
  }

  const filteredProducts = products.filter(
    (product) =>
      (product.product_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (product.qr_code?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  )

  const paginatedFilteredProducts = paginateItems(filteredProducts, modalCurrentPage)

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    }

    getCameraPermissions()
  }, [])

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true)
    const product = products.find((p) => String(p.product_id) === data)
    if (product && !selectedProducts.includes(product.product_id)) {
      setSelectedProducts((prev) => [...prev, product.product_id])
      setProductQuantities((prev) => ({ ...prev, [product.product_id]: 1 }))
    }
    setScannerVisible(false)
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    setProductQuantities((prev) => {
      const newQuantities = { ...prev }
      delete newQuantities[productId]
      return newQuantities
    })
  }

  const handleCheckboxChange = (itemId: number) => {
    setTempSelectedProducts((prevSelected) => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter((id) => id !== itemId)
      } else {
        setProductQuantities((prev) => ({
          ...prev,
          [itemId]: prev[itemId] || 1,
        }))
        return [...prevSelected, itemId]
      }
    })
  }

  useEffect(() => {
    const selectedWithQuantities = selectedProducts.map((id) => ({
      product_id: id,
      quantity: productQuantities[id] || 1,
    }))
    console.log("Selected Products:", selectedWithQuantities)
  }, [selectedProducts, productQuantities])

  const handleConfirmSelection = () => {
    setSelectedProducts(tempSelectedProducts)
    setModalVisible(false)

    // Log selected products with their quantities
    const selectedWithQuantities = tempSelectedProducts.map((id) => ({
      product_id: id,
      quantity: productQuantities[id] || 1,
    }))
    console.log("Selected Products:", selectedWithQuantities)
  }

  const handleOpenModal = () => {
    setTempSelectedProducts(selectedProducts)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleOpenModal}
          style={[styles.selectButton, { flex: 1, marginRight: 8 }]}
          icon={({ size, color }) => <AntDesign name="plus" size={size} color={"white"} />}
        >
          Select Products to add
        </Button>
        <Button
          mode="contained"
          onPress={() => setScannerVisible(true)}
          style={[styles.selectButton, { width: 90, paddingHorizontal: 10 }]}
        >
          <MaterialCommunityIcons name="barcode-scan" size={20} color={"white"} />
        </Button>
      </View>

      <Pagination
        currentPage={currentPage}
        totalItems={selectedProducts.length}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />

      <ScrollView style={styles.scrollView}>
        {getSelectedProducts().length > 0 ? (
          getSelectedProducts().map((item) => (
            <MainPageProductCard
              key={item.product_id}
              item={item}
              productQuantities={productQuantities}
              setProductQuantities={setProductQuantities}
              handleDelete={handleDelete}
              openEditModal={openEditModal}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No products to add</Text>
        )}
      </ScrollView>

      <ProductSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        modalCurrentPage={modalCurrentPage}
        paginatedFilteredProducts={paginatedFilteredProducts}
        filteredProducts={filteredProducts}
        setModalCurrentPage={setModalCurrentPage}
        tempSelectedProducts={tempSelectedProducts}
        productQuantities={productQuantities}
        setProductQuantities={setProductQuantities}
        handleCheckboxChange={handleCheckboxChange}
        handleConfirmSelection={handleConfirmSelection}
        itemsPerPage={itemsPerPage}
      />

      <ScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        hasPermission={hasPermission}
        scanned={scanned}
        handleBarcodeScanned={handleBarcodeScanned}
        setScanned={setScanned}
      />

      <View style={styles.saveButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSaveChanges}
          style={styles.saveButton}
          icon={({ size, color }) => <MaterialCommunityIcons name="content-save" size={size} color={"white"} />}
        >
          Save Selected Products
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#efefef",
  },
  scrollView: {
    flex: 1,
    padding: 16,
    backgroundColor: "#efefef",
  },
  selectButton: {
    margin: 16,
    backgroundColor: "black",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
  buttonContainer: {
    flexDirection: "row",
    margin: 16,
    alignItems: "center",
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "black",
    paddingVertical: 8,
  },
})
