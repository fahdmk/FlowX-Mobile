export interface Product {
    product_id: number
    product_name: string
    brand_id: number | null
    product_length: number
    product_depth: number
    product_width: number
    base_price: number
    hierarchy_id: number | null
    imageUrl: string
    isInStock: boolean
    arrivalDate: string
    current_quantity?: number
    qr_code?: string
  }
