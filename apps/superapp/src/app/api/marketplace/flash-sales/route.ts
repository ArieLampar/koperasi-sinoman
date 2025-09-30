import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get active flash sale products
    const { data: flashSaleProducts, error } = await supabase
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
        )
      `)
      .eq('status', 'active')
      .eq('is_flash_sale', true)
      .not('flash_sale_end', 'is', null)
      .gte('flash_sale_end', new Date().toISOString())
      .order('flash_sale_end', { ascending: true })

    if (error) {
      console.error('Error fetching flash sale products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch flash sales' },
        { status: 500 }
      )
    }

    // Group products by flash sale event (for now, create a single event)
    // In a real implementation, you might have a separate flash_sales table
    const flashSales = []

    if (flashSaleProducts && flashSaleProducts.length > 0) {
      // Find the earliest end time for the main flash sale
      const earliestEndTime = flashSaleProducts[0].flash_sale_end

      // Calculate discount percentage (average of all products)
      const avgDiscount = flashSaleProducts.reduce((acc, product) => {
        if (product.flash_sale_price && product.price) {
          const discount = ((product.price - product.flash_sale_price) / product.price) * 100
          return acc + discount
        }
        return acc
      }, 0) / flashSaleProducts.length

      const flashSale = {
        id: 'flash-sale-main',
        title: 'Flash Sale Spesial',
        subtitle: `Hemat hingga ${Math.round(avgDiscount)}% untuk produk pilihan`,
        end_time: earliestEndTime,
        discount_percentage: Math.round(avgDiscount),
        banner_image: '/images/flash-sale-banner.jpg',
        products: flashSaleProducts.slice(0, 10).map(product => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          image: product.images?.[0] || '/images/placeholder-product.jpg',
          price: product.price,
          member_price: product.member_price,
          rating: product.rating || 0,
          review_count: 0,
          category: product.category,
          is_flash_sale: true,
          flash_sale_price: product.flash_sale_price,
          flash_sale_end: product.flash_sale_end,
          stock: product.stock,
          store_name: product.store?.name || 'Toko',
          store_location: product.store?.location || '',
          is_favorite: false
        }))
      }

      flashSales.push(flashSale)
    }

    // Add a mock upcoming flash sale if no active ones
    if (flashSales.length === 0) {
      flashSales.push({
        id: 'flash-sale-upcoming',
        title: 'Flash Sale Akan Datang',
        subtitle: 'Dapatkan diskon hingga 50% segera!',
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        discount_percentage: 50,
        banner_image: '/images/flash-sale-coming-soon.jpg',
        products: []
      })
    }

    return NextResponse.json({
      data: flashSales
    })

  } catch (error) {
    console.error('Error in flash-sales API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}