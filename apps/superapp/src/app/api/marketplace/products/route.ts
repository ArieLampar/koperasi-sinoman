import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types
interface ProductFilters {
  category?: string
  search?: string
  min_price?: number
  max_price?: number
  store_id?: string
  is_flash_sale?: boolean
  limit?: number
  offset?: number
  sort_by?: 'name' | 'price' | 'rating' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters: ProductFilters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      store_id: searchParams.get('store_id') || undefined,
      is_flash_sale: searchParams.get('is_flash_sale') === 'true',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc'
    }

    // Build query
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
        reviews:marketplace_reviews(count)
      `)
      .eq('status', 'active')

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.min_price) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price) {
      query = query.lte('price', filters.max_price)
    }

    if (filters.store_id) {
      query = query.eq('store_id', filters.store_id)
    }

    if (filters.is_flash_sale) {
      query = query.eq('is_flash_sale', true)
        .not('flash_sale_end', 'is', null)
        .gte('flash_sale_end', new Date().toISOString())
    }

    // Apply sorting
    query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset!, filters.offset! + filters.limit! - 1)

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Transform data to include computed fields
    const transformedProducts = products?.map(product => ({
      ...product,
      review_count: product.reviews?.[0]?.count || 0,
      current_price: product.is_flash_sale && product.flash_sale_price
        ? product.flash_sale_price
        : product.price,
      has_discount: product.is_flash_sale || Boolean(product.member_price)
    }))

    return NextResponse.json({
      data: transformedProducts,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: transformedProducts?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'store_id', 'stock']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Check if user owns the store or is admin
    const { data: store, error: storeError } = await supabase
      .from('marketplace_stores')
      .select('owner_id')
      .eq('id', body.store_id)
      .single()

    if (storeError || store.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only add products to your own store' },
        { status: 403 }
      )
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Insert product
    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        ...body,
        slug,
        created_by: user.id,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: product }, { status: 201 })

  } catch (error) {
    console.error('Error in products POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}