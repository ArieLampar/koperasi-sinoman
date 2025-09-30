import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get categories with product counts
    const { data: categories, error } = await supabase
      .from('marketplace_products')
      .select('category')
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Count products per category
    const categoryStats = categories?.reduce((acc: Record<string, number>, product) => {
      const category = product.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Define category metadata
    const categoryMetadata: Record<string, { name: string; icon: string }> = {
      food: { name: 'Makanan', icon: '🍎' },
      beverage: { name: 'Minuman', icon: '🥤' },
      health: { name: 'Kesehatan', icon: '💊' },
      beauty: { name: 'Kecantikan', icon: '💄' },
      fashion: { name: 'Fashion', icon: '👕' },
      electronics: { name: 'Elektronik', icon: '📱' },
      books: { name: 'Buku', icon: '📚' },
      sports: { name: 'Olahraga', icon: '⚽' },
      home: { name: 'Rumah Tangga', icon: '🏠' },
      toys: { name: 'Mainan', icon: '🧸' },
      automotive: { name: 'Otomotif', icon: '🚗' },
      other: { name: 'Lainnya', icon: '📦' }
    }

    // Build category list
    const result = Object.keys(categoryStats || {}).map(categoryId => ({
      id: categoryId,
      name: categoryMetadata[categoryId]?.name || categoryId,
      icon: categoryMetadata[categoryId]?.icon || '📦',
      product_count: categoryStats?.[categoryId] || 0
    }))

    // Sort by product count descending
    result.sort((a, b) => b.product_count - a.product_count)

    return NextResponse.json({
      data: result
    })

  } catch (error) {
    console.error('Error in categories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}