import type React from "react"
import { StyleSheet, Image, View, TouchableOpacity, Text, TextInput, Keyboard } from "react-native"
import { Card, Title, Paragraph } from "react-native-paper"
import { Feather } from "@expo/vector-icons"
import type { Product } from "../types/Product"

interface MainPageProductCardProps {
  item: Product
  productQuantities: Record<number, number | string>
  setProductQuantities: React.Dispatch<React.SetStateAction<Record<number, number | string>>>
  handleDelete: (productId: number) => void
  openEditModal: (productId: number) => void
}

const MainPageProductCard = ({
  item,
  productQuantities,
  setProductQuantities,
  handleDelete,
  openEditModal,
}: MainPageProductCardProps) => {
  return (
    <Card key={item.product_id} style={styles.card}>
      <Title style={[styles.productTitle, { margin: 20 }]}>{item.product_name}</Title>
      <View style={styles.productContent}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <View style={styles.separator} />
        <View style={styles.productInfo}>
          <Paragraph style={styles.productDetails}>Brand ID: {item.brand_id || "N/A"}</Paragraph>
          <Paragraph style={styles.productDetails}>
            Dimensions: {item.product_length} × {item.product_width} × {item.product_depth} cm
          </Paragraph>
          <Paragraph style={styles.productDetails}>Price: ${item.base_price.toFixed(2)}</Paragraph>
          <Paragraph style={styles.productDetails}>Date of arrival: {item.arrivalDate}</Paragraph>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity to add:</Text>
            <View style={styles.quantityControls}>
              <TextInput
                style={styles.quantityInput}
                value={String(productQuantities[item.product_id] || "")}
                keyboardType="numeric"
                onChangeText={(text) => {
                  // Store the raw text input in state
                  setProductQuantities((prev) => ({
                    ...prev,
                    [item.product_id]: text,
                  }))
                }}
                placeholder="Enter quantity"
                blurOnSubmit={false}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>
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
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    margin: 20,
  },
  productContent: {
    flexDirection: "row",
    padding: 8,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  separator: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-around",
  },
  productDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    justifyContent: "space-between",
  },
  cardbutton: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  quantityContainer: {
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: "black",
    marginBottom: 4,
    fontWeight: "bold",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
  },
  quantityInput: {
    textAlign: "center",
    minWidth: 40,
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#333",
  },
})

export default MainPageProductCard
