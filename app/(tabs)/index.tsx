"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Card, Title, Paragraph } from "react-native-paper"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import supabase from "../../Config/SuperbaseClient"

interface Product {
  product_id: number
  product_name: string
  brand_id: number | null
  product_length: number
  product_depth: number
  product_width: number
  base_price: number
  hierarchy_id: number | null
  stockData: {
    qty: number
  }
  imageUrl: string
  isInStock: boolean
  arrivalDate: string
}

interface ConsumptionRecord {
  productId: number
  quantity: number
  date: string
  consumptionValue: number
}

const ITEMS_PER_PAGE = 4
export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isModalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [newStockQuantity, setNewStockQuantity] = useState<string>("")
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [modalSearchQuery, setModalSearchQuery] = useState("")

  let productConsumptionValues: { [key: number]: string } = {}

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("real_time_inventory")
        .select("product_id, current_quantity")
        .eq("store_id", 1)

      if (inventoryError) {
        throw inventoryError
      }

      if (inventoryData && inventoryData.length > 0) {
        const productIds = inventoryData.map((item) => item.product_id)

        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .in("product_id", productIds)

        if (productError) {
          throw productError
        }

        if (productData) {
          const transformedProducts: Product[] = productData.map((item) => {
            const inventoryItem = inventoryData.find((inv) => inv.product_id === item.product_id)

            return {
              product_id: item.product_id,
              product_name: item.product_name,
              brand_id: item.brand_id,
              product_length: item.product_length,
              product_depth: item.product_depth,
              product_width: item.product_width,
              base_price: item.base_price,
              hierarchy_id: item.hierarchy_id,
              stockData: { qty: inventoryItem?.current_quantity || 0 },
              imageUrl: item.image_url || "https://images.unsplash.com/photo-1584305574646-8e8a72f147b7?w=400&q=80",
              isInStock: (inventoryItem?.current_quantity || 0) > 0,
              arrivalDate: item.arrival_date || new Date().toISOString().split("T")[0],
            }
          })

          setProducts(transformedProducts)
          setFetchError(null)
        }
      } else {
        setProducts([])
        setFetchError("No products found in real-time inventory")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setFetchError("Could not fetch products from the database")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (productId: number) => {
    try {
      const { error } = await supabase.from("real_time_inventory").delete().eq("product_id", productId)

      if (error) {
        throw error
      }

      setProducts((prevProducts) => prevProducts.filter((product) => product.product_id !== productId))

      console.log(`Deleted product with id: ${productId}`)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const openEditModal = (productId: number) => {
    setSelectedProductId(productId)
    setEditModalVisible(true)

    const product = products.find((p) => p.product_id === productId)
    if (product) {
      setNewStockQuantity(product.stockData.qty.toString())
    }
  }

  const handleEditStock = async () => {
    if (selectedProductId && newStockQuantity) {
      try {
        const { error } = await supabase
          .from("real_time_inventory")
          .update({ current_quantity: Number.parseInt(newStockQuantity, 10) })
          .eq("product_id", selectedProductId)

        if (error) {
          throw error
        }

        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            if (product.product_id === selectedProductId) {
              return {
                ...product,
                stockData: {
                  ...product.stockData,
                  qty: Number.parseInt(newStockQuantity, 10),
                },
                isInStock: Number.parseInt(newStockQuantity, 10) > 0,
              }
            }
            return product
          }),
        )

        console.log(`Updated stock for product ID: ${selectedProductId} to ${newStockQuantity}`)
      } catch (error) {
        console.error("Error updating stock:", error)
      } finally {
        setEditModalVisible(false)
        setNewStockQuantity("")
      }
    }
  }

  const filteredProducts = products.filter(
    (product) => product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) && product.stockData.qty > 0,
  )

  const filteredModalProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) && product.stockData.qty > 0,
  )

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleConsumptionChange = (productId: number, value: string) => {
    productConsumptionValues[productId] = value
  }

  const handleRecordConsumption = async () => {
    const newRecords = []
    const updatedProducts = [...products]

    try {
      for (const [productIdStr, quantityStr] of Object.entries(productConsumptionValues)) {
        const productId = Number.parseInt(productIdStr, 10)
        const quantity = Number.parseInt(quantityStr, 10)

        if (quantity > 0) {
          const productIndex = updatedProducts.findIndex((p) => p.product_id === productId)

          if (productIndex !== -1 && updatedProducts[productIndex].stockData.qty >= quantity) {
            const newRecord = {
              productId,
              quantity,
              date: new Date().toISOString(),
              consumptionValue: quantity,
            }

            newRecords.push(newRecord)

            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stockData: {
                ...updatedProducts[productIndex].stockData,
                qty: updatedProducts[productIndex].stockData.qty - quantity,
              },
            }

            // Update stock in Supabase
            const { error } = await supabase
              .from("real_time_inventory")
              .update({
                current_quantity: updatedProducts[productIndex].stockData.qty,
              })
              .eq("product_id", productId)
              .eq("store_id", 1)

            if (error) {
              throw error
            }
          }
        }
      }

      if (newRecords.length > 0) {
        setConsumptionRecords([...consumptionRecords, ...newRecords])
        setProducts(updatedProducts)
        console.log("New consumption records:", newRecords)
      }
    } catch (error) {
      console.error("Error recording consumption:", error)
    } finally {
      // Clear consumption values and close the modal
      productConsumptionValues = {}
      setModalVisible(false)
      setModalSearchQuery("")
    }
  }

  const ConsumptionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Title style={styles.modalTitle}>Record Consumption</Title>

          <TextInput
            style={styles.modalSearch}
            placeholder="Search products..."
            value={modalSearchQuery}
            onChangeText={setModalSearchQuery}
          />

          <ScrollView style={styles.modalProductList}>
            {filteredModalProducts.map((product) => (
              <View key={product.product_id} style={styles.modalProductItem}>
                <Image source={{ uri: product.imageUrl }} style={styles.modalProductImage} />
                <View style={styles.modalProductInfo}>
                  <Text style={styles.modalProductName}>{product.product_name}</Text>
                  <Text style={styles.modalProductStock}>In stock: {product.stockData.qty}</Text>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    defaultValue={productConsumptionValues[product.product_id] || ""}
                    onChangeText={(value) => handleConsumptionChange(product.product_id, value)}
                    placeholder="Enter consumption"
                    returnKeyType="done"
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleRecordConsumption}>
              <Text style={styles.modalButtonTextPrimary}>Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )

  // Edit Stock Modal Component
  const EditStockModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Title style={styles.modalTitle}>Edit Stock Quantity</Title>

          <TextInput
            style={styles.quantityInput}
            placeholder="Enter new stock quantity"
            keyboardType="numeric"
            value={newStockQuantity}
            onChangeText={setNewStockQuantity}
            returnKeyType="done"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleEditStock}>
              <Text style={styles.modalButtonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )

  const PaginationFooter = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.pageButtonText}>Previous</Text>
      </TouchableOpacity>

      <View style={styles.pageNumbers}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <TouchableOpacity
            key={pageNum}
            style={[styles.pageNumberButton, currentPage === pageNum && styles.activePageButton]}
            onPress={() => handlePageChange(pageNum)}
          >
            <Text style={[styles.pageNumberText, currentPage === pageNum && styles.activePageText]}>{pageNum}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.pageButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    )
  }

  if (fetchError && products.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true)
            setFetchError(null)
            setCurrentPage(currentPage)
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.inputsearch}
            placeholder="Search Product"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.consumptionButton} onPress={() => setModalVisible(true)}>
          <MaterialIcons name="remove-shopping-cart" size={24} color="white" />
          <Text style={styles.consumptionButtonText}>Record Consumption</Text>
        </TouchableOpacity>
      </View>

      {fetchError && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{fetchError} - Showing cached data</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((item) => (
            <Card key={item.product_id} style={styles.card}>
              <Title style={styles.productTitle}>{item.product_name}</Title>
              <View style={styles.productContent}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <View style={styles.separator} />
                <View style={styles.productInfo}>
                  <Paragraph style={styles.productDetails}>Brand ID: {item.brand_id || "N/A"}</Paragraph>
                  <Paragraph style={styles.productDetails}>
                    Dimensions: {item.product_length} × {item.product_width} × {item.product_depth} cm
                  </Paragraph>
                  <Paragraph style={styles.productDetails}>Price: ${item.base_price.toFixed(2)}</Paragraph>
                  <Paragraph style={styles.productDetails}>Stock: {item.stockData.qty}</Paragraph>
                  <Paragraph style={styles.productDetails}>Date of arrival: {item.arrivalDate}</Paragraph>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cardbutton} onPress={() => handleDelete(item.product_id)}>
                  <View style={styles.buttonContent}>
                    <Feather name="trash" size={24} color="black" />
                    <Text style={styles.buttonText}>Delete</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cardbutton} onPress={() => openEditModal(item.product_id)}>
                  <View style={styles.buttonContent}>
                    <Feather name="edit" size={24} color="black" />
                    <Text style={styles.buttonText}>Edit Stock</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or add new products</Text>
          </View>
        )}

        {paginatedProducts.length > 0 && <PaginationFooter />}
      </ScrollView>
      <ConsumptionModal />
      <EditStockModal />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  warningBanner: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  warningText: {
    color: "#856404",
    textAlign: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  consumptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  consumptionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalSearch: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalProductList: {
    maxHeight: 300,
  },
  modalProductItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedProductItem: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modalProductInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalProductStock: {
    color: "#666",
    marginTop: 4,
  },
  modalProductConsumption: {
    color: "#2196F3",
    marginTop: 4,
    fontWeight: "500",
  },
  quantityContainer: {
    marginTop: 16,
  },
  quantityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalConsumption: {
    marginTop: 8,
    color: "#2196F3",
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#2196F3",
  },
  modalButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  modalButtonTextPrimary: {
    color: "white",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 16,
    color: "#333",
  },
  productContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  separator: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productDetails: {
    marginBottom: 4,
    fontSize: 14,
    color: "#666",
  },
  productDetailsCrossed: {
    marginBottom: 4,
    fontSize: 14,
    color: "#666",
    textDecorationLine: "line-through",
  },
  stock: {
    fontWeight: "bold",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cardbutton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputsearch: {
    padding: 10,
    height: 40,
    margin: 10,
    width: "95%",
    borderColor: "black",
    backgroundColor: "white",
    borderWidth: 1,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: "row",
  },
  searchButton: {
    height: 40,
    borderColor: "Black",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#fff",
    width: 40,
    marginTop: 10,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 13,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontWeight: "bold",
    color: "#333",
  },
  pageNumbers: {
    flexDirection: "row",
    gap: 8,
  },
  pageNumberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  activePageButton: {
    backgroundColor: "#333",
  },
  pageNumberText: {
    fontWeight: "bold",
    color: "#333",
  },
  activePageText: {
    color: "white",
  },
})

