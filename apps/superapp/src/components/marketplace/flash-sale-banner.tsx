'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight, Zap, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'

interface FlashSaleProduct {
  id: string
  slug: string
  name: string
  image: string
  original_price: number
  sale_price: number
  stock: number
  sold: number
}

interface FlashSaleBannerProps {
  title: string
  subtitle?: string
  endTime: string
  discountPercentage: number
  backgroundImage?: string
  products?: FlashSaleProduct[]
  href?: string
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function useCountdown(endTime: string): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        }
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return {
        hours,
        minutes,
        seconds,
        isExpired: false
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return timeLeft
}

function CountdownTimer({ endTime, variant = 'default' }: {
  endTime: string
  variant?: 'default' | 'compact' | 'minimal'
}) {
  const timeLeft = useCountdown(endTime)

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center space-x-2 text-white">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Berakhir</span>
      </div>
    )
  }

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className={cn(
      'flex flex-col items-center',
      variant === 'minimal' && 'flex-row space-x-1'
    )}>
      <div className={cn(
        'bg-white/20 rounded px-2 py-1 min-w-[2rem] text-center',
        variant === 'compact' && 'px-1.5 py-0.5 text-xs',
        variant === 'minimal' && 'px-1 py-0.5 text-xs'
      )}>
        <span className="font-bold text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      {variant !== 'minimal' && (
        <span className={cn(
          'text-xs text-white/80 mt-1',
          variant === 'compact' && 'text-[10px]'
        )}>
          {label}
        </span>
      )}
    </div>
  )

  return (
    <div className="flex items-center space-x-2">
      <Clock className={cn(
        'text-white',
        variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'
      )} />
      <div className={cn(
        'flex items-center space-x-2',
        variant === 'minimal' && 'space-x-1'
      )}>
        <TimeUnit value={timeLeft.hours} label="Jam" />
        <span className="text-white font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="Menit" />
        <span className="text-white font-bold">:</span>
        <TimeUnit value={timeLeft.seconds} label="Detik" />
      </div>
    </div>
  )
}

export function FlashSaleBanner({
  title,
  subtitle,
  endTime,
  discountPercentage,
  backgroundImage,
  products = [],
  href = '/toko/flash-sale',
  className,
  variant = 'default'
}: FlashSaleBannerProps) {
  const isCompact = variant === 'compact'
  const isMinimal = variant === 'minimal'

  const bannerContent = (
    <div className={cn(
      'relative overflow-hidden rounded-lg text-white',
      'bg-gradient-to-r from-primary-600 via-primary-500 to-accent-teal',
      isMinimal && 'rounded-md',
      className
    )}>
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt="Flash sale background"
            fill
            className="object-cover opacity-20"
          />
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute top-1/2 -left-8 w-16 h-16 bg-white/5 rounded-full animate-bounce" />
        <div className="absolute bottom-4 right-1/4 w-8 h-8 bg-white/10 rounded-full animate-ping" />
      </div>

      {/* Content */}
      <div className={cn(
        'relative z-10',
        isMinimal ? 'p-3' : isCompact ? 'p-4' : 'p-6'
      )}>
        <div className={cn(
          'flex items-center justify-between',
          isMinimal && 'flex-col space-y-2',
          !isMinimal && 'mb-4'
        )}>
          {/* Left Section - Title & Countdown */}
          <div className={cn(isMinimal && 'text-center')}>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className={cn(
                'text-yellow-300',
                isCompact ? 'h-5 w-5' : 'h-6 w-6'
              )} />
              <h2 className={cn(
                'font-bold text-white',
                isMinimal ? 'text-lg' : isCompact ? 'text-xl' : 'text-2xl'
              )}>
                {title}
              </h2>
              <Badge className="bg-accent-orange text-white border-0 px-2 py-1">
                -{discountPercentage}%
              </Badge>
            </div>

            {subtitle && !isMinimal && (
              <p className={cn(
                'text-white/90 mb-3',
                isCompact ? 'text-sm' : 'text-base'
              )}>
                {subtitle}
              </p>
            )}

            {/* Countdown Timer */}
            <CountdownTimer
              endTime={endTime}
              variant={isMinimal ? 'minimal' : isCompact ? 'compact' : 'default'}
            />
          </div>

          {/* Right Section - CTA Button (not for minimal) */}
          {!isMinimal && (
            <div className="flex-shrink-0">
              <Button
                variant="secondary"
                className={cn(
                  'bg-white text-primary-600 hover:bg-white/90 font-medium',
                  isCompact ? 'text-sm px-4 py-2' : 'px-6 py-3'
                )}
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Products Preview (default variant only) */}
        {!isCompact && !isMinimal && products.length > 0 && (
          <div className="mt-4">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
              {products.slice(0, 5).map((product) => {
                const discountPercent = Math.round(
                  ((product.original_price - product.sale_price) / product.original_price) * 100
                )

                return (
                  <Link
                    key={product.id}
                    href={`/toko/produk/${product.slug}`}
                    className="flex-shrink-0 w-20 text-center group"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 border-2 border-white/50 group-hover:border-white transition-colors">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium truncate text-white group-hover:text-yellow-200 transition-colors">
                      {product.name}
                    </p>
                    <div className="flex flex-col items-center mt-1">
                      <p className="text-xs font-bold text-yellow-200">
                        {formatCurrency(product.sale_price)}
                      </p>
                      <p className="text-[10px] text-white/70 line-through">
                        {formatCurrency(product.original_price)}
                      </p>
                    </div>
                    <Badge className="bg-red-500 text-white text-[10px] px-1 py-0 mt-1">
                      -{discountPercent}%
                    </Badge>
                  </Link>
                )
              })}

              {/* View All Card */}
              <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/50 flex items-center justify-center mb-2 hover:border-white transition-colors">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium text-white">Lihat Semua</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA for minimal variant */}
        {isMinimal && (
          <div className="text-center mt-2">
            <span className="text-sm text-white/90 hover:text-white transition-colors cursor-pointer">
              Lihat Semua →
            </span>
          </div>
        )}
      </div>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0">
        <div className="w-16 h-16 bg-gradient-to-bl from-yellow-400/30 to-transparent" />
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {bannerContent}
    </Link>
  ) : (
    bannerContent
  )
}

// Flash Sale Banner Skeleton
export function FlashSaleBannerSkeleton({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'compact' | 'minimal'
  className?: string
}) {
  const isMinimal = variant === 'minimal'
  const isCompact = variant === 'compact'

  return (
    <div className={cn(
      'animate-pulse bg-neutral-200 rounded-lg',
      isMinimal ? 'h-20' : isCompact ? 'h-32' : 'h-40',
      className
    )}>
      <div className={cn(
        'h-full bg-gradient-to-r from-neutral-300 to-neutral-200 rounded-lg',
        'flex items-center justify-between',
        isMinimal ? 'px-3' : isCompact ? 'px-4' : 'px-6'
      )}>
        {/* Left content skeleton */}
        <div className="space-y-2">
          <div className={cn(
            'bg-neutral-400 rounded',
            isMinimal ? 'h-4 w-24' : isCompact ? 'h-5 w-32' : 'h-6 w-40'
          )} />
          <div className={cn(
            'bg-neutral-300 rounded',
            isMinimal ? 'h-3 w-20' : isCompact ? 'h-4 w-28' : 'h-4 w-36'
          )} />
        </div>

        {/* Right content skeleton */}
        {!isMinimal && (
          <div className={cn(
            'bg-neutral-400 rounded',
            isCompact ? 'h-8 w-20' : 'h-10 w-24'
          )} />
        )}
      </div>
    </div>
  )
}