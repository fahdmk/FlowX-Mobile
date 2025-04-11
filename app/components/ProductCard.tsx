import type React from "react"
import { StyleSheet, Image, View, Text, TextInput, Keyboard } from "react-native"
import { Card, Title, Paragraph, Checkbox } from "react-native-paper"
import type { Product } from "../types/Product"

interface ProductCardProps {
  item: Product
  showCheckbox?: boolean
  isSelected?: boolean
  productQuantities: Record<number, number | string>
  setProductQuantities: React.Dispatch<React.SetStateAction<Record<number, number | string>>>
  handleCheckboxChange: (itemId: number) => void
}

const ProductCard = ({
  item,
  showCheckbox = false,
  isSelected = false,
  productQuantities,
  setProductQuantities,
  handleCheckboxChange,
}: ProductCardProps) => (
  <Card style={styles.card}>
    <Card.Content>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Title style={[styles.productTitle, { margin: 8 }]}>{item.product_name}</Title>
        {showCheckbox && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => handleCheckboxChange(item.product_id)}
              color={isSelected ? "black" : undefined}
            />
            <Text style={[styles.checkboxText, { color: isSelected ? "black" : "#666" }]}>Select</Text>
          </View>
        )}
      </View>
      <View style={styles.productContent}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
        <View style={styles.separator} />
        <View style={styles.productInfo}>
          <Paragraph style={styles.productDetails}>Reference: {item.product_id}</Paragraph>
          <Paragraph style={styles.productDetails}>Name: {item.product_name}</Paragraph>
          <Paragraph style={styles.productDetails}>Price: ${item.base_price}</Paragraph>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity to add:</Text>
            <View style={styles.quantityControls}>
              <TextInput
                style={styles.quantityInput}
                value={String(productQuantities[item.product_id] || "")}
                keyboardType="numeric"
                onChangeText={(text) => {
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
    </Card.Content>
  </Card>
)

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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
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

export default ProductCard
