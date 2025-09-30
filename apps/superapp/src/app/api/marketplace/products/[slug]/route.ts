import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Props {
  params: { slug: string }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { slug } = params

    // Query product by slug or id
    let query = supabase
      .from('marketplace_products')
      .select(`
        *,
        store:marketplace_stores(
          id,
          name,
          location,
          rating,
          verified,
          logo
        ),
        reviews:marketplace_reviews(
          id,
          user_name,
          user_avatar,
          rating,
          comment,
          created_at,
          images,
          helpful_count
        )
      `)
      .eq('status', 'active')

    // Try to find by slug first, then by id if not found
    const { data: productBySlug } = await query.eq('slug', slug).single()

    let product = productBySlug

    // If not found by slug, try by id
    if (!product) {
      const { data: productById } = await query.eq('id', slug).single()
      product = productById
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get related products from the same category
    const { data: relatedProducts } = await supabase
      .from('marketplace_products')
      .select(`
        id,
        slug,
        name,
        images,
        price,
        member_price,
        rating,
        store:marketplace_stores(name)
      `)
      .eq('category', product.category)
      .eq('status', 'active')
      .neq('id', product.id)
      .limit(4)

    // Transform the product data
    const transformedProduct = {
      ...product,
      images: product.images || ['/images/placeholder-product.jpg'],
      review_count: product.reviews?.length || 0,
      reviews: product.reviews || [],
      related_products: relatedProducts?.map(rp => ({
        id: rp.id,
        slug: rp.slug || rp.id,
        name: rp.name,
        image: rp.images?.[0] || '/images/placeholder-product.jpg',
        price: rp.price,
        member_price: rp.member_price,
        rating: rp.rating || 0,
        store_name: rp.store?.name || 'Toko'
      })) || [],
      specifications: product.specifications || [
        { key: 'Berat', value: `${product.weight || 500}g` },
        { key: 'Kategori', value: product.category },
        { key: 'SKU', value: product.sku || 'N/A' }
      ],
      dimensions: product.dimensions || {
        length: 10,
        width: 10,
        height: 10
      },
      tags: product.tags || [product.category],
      is_favorite: false, // This would come from user preferences
      view_count: product.view_count || 0,
      sold_count: product.sold_count || 0
    }

    // Increment view count (optional - do this asynchronously)
    supabase
      .from('marketplace_products')
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq('id', product.id)
      .then(() => {}) // Fire and forget

    return NextResponse.json({
      data: transformedProduct
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}