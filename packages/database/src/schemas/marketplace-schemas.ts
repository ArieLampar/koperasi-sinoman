import { z } from 'zod'
import {
  uuidSchema,
  amountSchema,
  urlSchema,
  slugSchema,
  emailSchema,
  phoneSchema,
  businessTypeSchema,
  productStatusSchema,
  paginationSchema,
  createUpdateSchema,
  createFilterSchema,
} from './common-schemas'

// Product category schemas
export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Category name required').max(100, 'Category name too long'),
  slug: slugSchema,
  description: z.string().max(1000, 'Description too long').optional(),
  parent_id: uuidSchema.optional(),
  image_url: urlSchema,
  sort_order: z.number().int().min(0, 'Sort order must be positive').default(0),
  is_active: z.boolean().default(true),
})

export const updateProductCategorySchema = createUpdateSchema(createProductCategorySchema.shape)

// Seller schemas
export const createSellerSchema = z.object({
  member_id: uuidSchema.optional(),
  business_name: z.string().min(1, 'Business name required').max(255, 'Business name too long'),
  business_type: businessTypeSchema,
  description: z.string().max(1000, 'Description too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  business_license: z.string().max(100, 'Business license too long').optional(),
  tax_number: z.string().max(50, 'Tax number too long').optional(),
})

export const updateSellerSchema = createUpdateSchema({
  ...createSellerSchema.shape,
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
  commission_rate: z.number().min(0, 'Commission rate must be positive').max(1, 'Commission rate cannot exceed 100%'),
})

export const sellerFiltersSchema = createFilterSchema({
  member_id: uuidSchema,
  business_type: businessTypeSchema,
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
  search: z.string().min(1, 'Search query required'),
})

// Product schemas
export const createProductSchema = z.object({
  seller_id: uuidSchema,
  category_id: uuidSchema,
  name: z.string().min(1, 'Product name required').max(255, 'Product name too long'),
  slug: slugSchema,
  description: z.string().max(5000, 'Description too long').optional(),
  short_description: z.string().max(500, 'Short description too long').optional(),
  price: amountSchema.min(100, 'Minimum price is Rp 100'),
  member_price: amountSchema.optional(),
  cost_price: amountSchema.optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be positive').default(0),
  min_stock_level: z.number().int().min(0, 'Min stock level must be positive').default(5),
  max_order_quantity: z.number().int().min(1, 'Max order quantity must be at least 1').optional(),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  dimensions: z.object({
    length: z.number().min(0, 'Length must be positive').optional(),
    width: z.number().min(0, 'Width must be positive').optional(),
    height: z.number().min(0, 'Height must be positive').optional(),
  }).optional(),
  images: z.array(urlSchema).max(10, 'Maximum 10 images allowed').optional(),
  meta_title: z.string().max(255, 'Meta title too long').optional(),
  meta_description: z.string().max(500, 'Meta description too long').optional(),
  is_featured: z.boolean().default(false),
  is_digital: z.boolean().default(false),
  requires_shipping: z.boolean().default(true),
  available_from: z.string().datetime().optional(),
  available_until: z.string().datetime().optional(),
}).refine(
  data => !data.member_price || data.member_price <= data.price,
  'Member price cannot be higher than regular price'
).refine(
  data => !data.cost_price || data.cost_price <= data.price,
  'Cost price cannot be higher than selling price'
).refine(
  data => !data.available_from || !data.available_until || data.available_from <= data.available_until,
  'Available from date must be before available until date'
)

export const updateProductSchema = createUpdateSchema({
  ...createProductSchema.shape,
  status: productStatusSchema,
})

export const productFiltersSchema = createFilterSchema({
  seller_id: uuidSchema,
  category_id: uuidSchema,
  status: productStatusSchema,
  is_featured: z.boolean(),
  is_digital: z.boolean(),
  price_min: amountSchema,
  price_max: amountSchema,
  in_stock: z.boolean(),
  search: z.string().min(1, 'Search query required'),
})

export const productQuerySchema = z.object({
  ...productFiltersSchema.shape,
  ...paginationSchema.shape,
  sort_by: z.enum(['name', 'price', 'created_at', 'popularity', 'rating']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Product variant schemas
export const createProductVariantSchema = z.object({
  product_id: uuidSchema,
  name: z.string().min(1, 'Variant name required').max(100, 'Variant name too long'),
  value: z.string().min(1, 'Variant value required').max(100, 'Variant value too long'),
  price_adjustment: z.number().default(0),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be positive').default(0),
  sku: z.string().max(100, 'SKU too long').optional(),
  is_active: z.boolean().default(true),
})

export const updateProductVariantSchema = createUpdateSchema(createProductVariantSchema.shape)

// Order schemas
export const createOrderSchema = z.object({
  member_id: uuidSchema,
  items: z.array(z.object({
    product_id: uuidSchema,
    product_variant_id: uuidSchema.optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000, 'Maximum quantity is 1000'),
  })).min(1, 'At least one item required').max(50, 'Maximum 50 items per order'),
  shipping_address: z.object({
    recipient_name: z.string().min(1, 'Recipient name required').max(100, 'Recipient name too long'),
    phone: phoneSchema,
    address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
    city: z.string().min(1, 'City required').max(100, 'City name too long'),
    province: z.string().min(1, 'Province required').max(100, 'Province name too long'),
    postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
    notes: z.string().max(500, 'Notes too long').optional(),
  }),
  payment_method: z.string().max(50, 'Payment method too long').optional(),
  customer_notes: z.string().max(1000, 'Customer notes too long').optional(),
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  payment_reference: z.string().max(255, 'Payment reference too long').optional(),
  shipping_method: z.string().max(100, 'Shipping method too long').optional(),
  tracking_number: z.string().max(100, 'Tracking number too long').optional(),
  admin_notes: z.string().max(1000, 'Admin notes too long').optional(),
})

export const orderFiltersSchema = createFilterSchema({
  member_id: uuidSchema,
  seller_id: uuidSchema,
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
  amount_min: amountSchema,
  amount_max: amountSchema,
  search: z.string().min(1, 'Search query required'),
})

export const orderQuerySchema = z.object({
  ...orderFiltersSchema.shape,
  ...paginationSchema.shape,
  sort_by: z.enum(['created_at', 'total_amount', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Cart schemas
export const addToCartSchema = z.object({
  product_id: uuidSchema,
  product_variant_id: uuidSchema.optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum quantity is 100'),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be positive').max(100, 'Maximum quantity is 100'),
})

export const cartCheckoutSchema = z.object({
  shipping_address: z.object({
    recipient_name: z.string().min(1, 'Recipient name required').max(100, 'Recipient name too long'),
    phone: phoneSchema,
    address: z.string().min(10, 'Address too short').max(500, 'Address too long'),
    city: z.string().min(1, 'City required').max(100, 'City name too long'),
    province: z.string().min(1, 'Province required').max(100, 'Province name too long'),
    postal_code: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
    notes: z.string().max(500, 'Notes too long').optional(),
  }),
  payment_method: z.string().min(1, 'Payment method required').max(50, 'Payment method too long'),
  customer_notes: z.string().max(1000, 'Customer notes too long').optional(),
  use_member_discount: z.boolean().default(false),
})

// Review schemas
export const createProductReviewSchema = z.object({
  product_id: uuidSchema,
  order_item_id: uuidSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Review title required').max(100, 'Review title too long'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment too long'),
  images: z.array(urlSchema).max(5, 'Maximum 5 images allowed').optional(),
})

export const updateProductReviewSchema = createUpdateSchema({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Review title required').max(100, 'Review title too long'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment too long'),
  images: z.array(urlSchema).max(5, 'Maximum 5 images allowed'),
})

// Promotion schemas
export const createPromotionSchema = z.object({
  name: z.string().min(1, 'Promotion name required').max(100, 'Promotion name too long'),
  code: z.string().min(3, 'Promotion code must be at least 3 characters').max(20, 'Promotion code too long').regex(/^[A-Z0-9]+$/, 'Promotion code must be uppercase alphanumeric'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']),
  value: z.number().min(0, 'Promotion value must be positive'),
  minimum_order_amount: amountSchema.optional(),
  maximum_discount_amount: amountSchema.optional(),
  usage_limit: z.number().int().min(1, 'Usage limit must be at least 1').optional(),
  usage_limit_per_member: z.number().int().min(1, 'Usage limit per member must be at least 1').optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  applicable_products: z.array(uuidSchema).optional(),
  applicable_categories: z.array(uuidSchema).optional(),
  member_types_eligible: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
}).refine(
  data => data.valid_from <= data.valid_until,
  'Valid from date must be before valid until date'
).refine(
  data => data.type !== 'percentage' || data.value <= 100,
  'Percentage discount cannot exceed 100%'
)

// Marketplace report schemas
export const marketplaceReportSchema = z.object({
  report_type: z.enum(['sales', 'products', 'sellers', 'categories', 'commissions']),
  period_from: z.string().datetime(),
  period_to: z.string().datetime(),
  filters: z.object({
    seller_ids: z.array(uuidSchema).optional(),
    category_ids: z.array(uuidSchema).optional(),
    product_ids: z.array(uuidSchema).optional(),
  }).optional(),
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  group_by: z.enum(['seller', 'category', 'product', 'day', 'week', 'month']).optional(),
})

// Validation helper functions
export function validateProduct(data: unknown) {
  return createProductSchema.safeParse(data)
}

export function validateProductFilters(data: unknown) {
  return productFiltersSchema.safeParse(data)
}

export function validateOrder(data: unknown) {
  return createOrderSchema.safeParse(data)
}

export function validateOrderFilters(data: unknown) {
  return orderFiltersSchema.safeParse(data)
}