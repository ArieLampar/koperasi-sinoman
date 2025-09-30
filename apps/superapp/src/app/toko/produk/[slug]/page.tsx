import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetailClient from './product-detail-client'

// Types
interface Product {
  id: string
  slug: string
  name: string
  description: string
  long_description: string
  images: string[]
  price: number
  member_price?: number
  rating: number
  review_count: number
  category: string
  is_flash_sale: boolean
  flash_sale_price?: number
  flash_sale_end?: string
  stock: number
  sku: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  store: {
    id: string
    name: string
    location: string
    rating: number
    verified: boolean
    logo: string
  }
  specifications: Array<{
    key: string
    value: string
  }>
  reviews: Array<{
    id: string
    user_name: string
    user_avatar?: string
    rating: number
    comment: string
    date: string
    images?: string[]
    helpful_count: number
  }>
  related_products: Array<{
    id: string
    slug: string
    name: string
    image: string
    price: number
    member_price?: number
    rating: number
    store_name: string
  }>
  tags: string[]
  is_favorite?: boolean
  view_count: number
  sold_count: number
  created_at: string
  updated_at: string
}

interface Props {
  params: { slug: string }
}

// Function to fetch product data from API
async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/marketplace/products/${slug}`, {
      cache: 'no-store' // Ensure fresh data for each request
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch product')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching product:', error)

    // Fallback to mock data if API fails (for development)
    if (slug) {
      return {
        id: slug,
        slug: slug,
        name: `Premium Product ${slug}`,
        description: 'Deskripsi produk premium berkualitas tinggi',
        long_description: 'Deskripsi lengkap produk yang menjelaskan fitur dan manfaat produk ini secara detail.',
        images: ['/images/placeholder-product.jpg'],
        price: 125000,
        member_price: 100000,
        rating: 4.5,
        review_count: 0,
        category: 'health',
        is_flash_sale: false,
        stock: 10,
        sku: `SKU-${slug}`,
        weight: 500,
        dimensions: { length: 10, width: 10, height: 10 },
        store: {
          id: 'store-1',
          name: 'Toko Sample',
          location: 'Jakarta',
          rating: 4.5,
          verified: true,
          logo: '/images/placeholder-store.jpg'
        },
        specifications: [
          { key: 'Berat', value: '500g' },
          { key: 'Kategori', value: 'Kesehatan' }
        ],
        reviews: [],
        related_products: [],
        tags: ['sample', 'product'],
        is_favorite: false,
        view_count: 0,
        sold_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan',
      description: 'Produk yang Anda cari tidak tersedia.'
    }
  }

  const price = product.member_price || product.price
  const currency = 'IDR'

  return {
    title: `${product.name} - Toko Koperasi Sinoman`,
    description: product.description,
    keywords: [...product.tags, product.category, product.store.name],
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 800,
          alt: product.name,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.images[0]],
    },
    other: {
      // Structured data for products
      'product:price:amount': price.toString(),
      'product:price:currency': currency,
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:retailer_item_id': product.sku,
    },
  }
}

// Generate structured data
function generateStructuredData(product: Product) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.store.name
    },
    offers: {
      '@type': 'Offer',
      price: product.member_price || product.price,
      priceCurrency: 'IDR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.store.name
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
      bestRating: 5,
      worstRating: 1
    },
    review: product.reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.user_name
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: review.comment,
      datePublished: review.date
    }))
  }

  return structuredData
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const structuredData = generateStructuredData(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2),
        }}
      />
      <ProductDetailClient product={product} />
    </>
  )
}