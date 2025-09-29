'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { QrCode, MapPin, Phone, Mail, Calendar, User, Shield, Download, Printer, Share2, Copy } from 'lucide-react'

interface MemberCardProps {
  member: {
    id: string
    memberNumber: string
    name: string
    email?: string
    phone?: string
    address?: string
    joinDate: string
    status: 'active' | 'inactive' | 'suspended'
    profilePhoto?: string
    branch?: string
    memberType?: 'regular' | 'premium' | 'board'
  }
  className?: string
  variant?: 'default' | 'compact' | 'print'
  showQR?: boolean
  showActions?: boolean
  onDownload?: () => void
  onPrint?: () => void
  onShare?: () => void
}

const statusConfig = {
  active: {
    label: 'Aktif',
    color: 'bg-success-100 text-success-700 border-success-200',
    dotColor: 'bg-success-500'
  },
  inactive: {
    label: 'Tidak Aktif',
    color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    dotColor: 'bg-neutral-500'
  },
  suspended: {
    label: 'Dibekukan',
    color: 'bg-error-100 text-error-700 border-error-200',
    dotColor: 'bg-error-500'
  }
}

const memberTypeConfig = {
  regular: {
    label: 'Anggota Biasa',
    color: 'text-blue-600',
    icon: User
  },
  premium: {
    label: 'Anggota Premium',
    color: 'text-purple-600',
    icon: Shield
  },
  board: {
    label: 'Pengurus',
    color: 'text-orange-600',
    icon: Shield
  }
}

export const MemberCard = React.forwardRef<HTMLDivElement, MemberCardProps>(
  ({
    member,
    className,
    variant = 'default',
    showQR = true,
    showActions = true,
    onDownload,
    onPrint,
    onShare,
    ...props
  }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')
    const cardRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      // Generate QR code URL - in a real app, you might use a QR code library
      const qrData = `KOPERASI_SINOMAN:${member.memberNumber}:${member.name}:${member.id}`
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
      setQrCodeUrl(qrUrl)
    }, [member])

    const status = statusConfig[member.status]
    const memberType = memberTypeConfig[member.memberType || 'regular']
    const MemberTypeIcon = memberType.icon

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const copyMemberNumber = () => {
      navigator.clipboard.writeText(member.memberNumber)
      // You might want to show a toast here
    }

    const handlePrint = () => {
      if (onPrint) {
        onPrint()
      } else {
        window.print()
      }
    }

    const getCardStyles = () => {
      switch (variant) {
        case 'compact':
          return 'max-w-sm'
        case 'print':
          return 'max-w-none print:shadow-none print:border-black print:bg-white'
        default:
          return 'max-w-md'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg',
          getCardStyles(),
          'print:break-inside-avoid print:page-break-inside-avoid',
          className
        )}
        {...props}
      >
        {/* Header with Koperasi Sinoman Branding */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" fill="currentColor" viewBox="0 0 100 100">
              <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="currentColor" strokeWidth="1"/>
              </pattern>
              <rect width="100" height="100" fill="url(#diagonalHatch)" />
            </svg>
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold print:text-black">KOPERASI SINOMAN</h1>
              <p className="text-sm opacity-90 print:text-neutral-700">Kartu Anggota Digital</p>
            </div>

            {/* Logo Placeholder */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white bg-opacity-20 print:bg-opacity-100">
              <Shield className="h-6 w-6 text-white print:text-primary-600" />
            </div>
          </div>

          {/* Member Status Badge */}
          <div className="mt-3 flex items-center gap-2">
            <div className={cn('flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium', status.color)}>
              <div className={cn('h-1.5 w-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </div>
            <div className={cn('flex items-center gap-1 text-xs font-medium', memberType.color, 'text-white print:text-neutral-700')}>
              <MemberTypeIcon className="h-3 w-3" />
              {memberType.label}
            </div>
          </div>
        </div>

        {/* Member Information */}
        <div className={cn('p-6', variant === 'compact' && 'p-4')}>
          <div className={cn('flex gap-6', variant === 'compact' && 'flex-col gap-4')}>
            {/* Photo and Basic Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                {/* Profile Photo */}
                <div className="relative">
                  {member.profilePhoto ? (
                    <img
                      src={member.profilePhoto}
                      alt={member.name}
                      className="h-16 w-16 rounded-lg object-cover ring-2 ring-primary-100"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100 ring-2 ring-neutral-200">
                      <User className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div className={cn('absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white', status.dotColor)} />
                </div>

                {/* Basic Information */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-neutral-900 truncate print:text-black">
                    {member.name}
                  </h2>

                  {/* Member Number */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-mono text-neutral-600 print:text-black">
                      {member.memberNumber}
                    </span>
                    <button
                      onClick={copyMemberNumber}
                      className="text-neutral-400 hover:text-neutral-600 print:hidden"
                      title="Salin nomor anggota"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Join Date */}
                  <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600 print:text-black">
                    <Calendar className="h-3 w-3" />
                    <span>Bergabung {formatDate(member.joinDate)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {variant !== 'compact' && (
                <div className="mt-4 space-y-2">
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 print:text-black">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 print:text-black">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {member.address && (
                    <div className="flex items-start gap-2 text-sm text-neutral-600 print:text-black">
                      <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{member.address}</span>
                    </div>
                  )}

                  {member.branch && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 print:text-black">
                      <Shield className="h-3 w-3 flex-shrink-0" />
                      <span>Cabang {member.branch}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="flex flex-col items-center">
                <div className="rounded-lg bg-white p-3 shadow-inner ring-1 ring-neutral-200">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="h-24 w-24 print:h-20 print:w-20"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center bg-neutral-100 print:h-20 print:w-20">
                      <QrCode className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-neutral-500 print:text-black">Scan untuk verifikasi</p>
              </div>
            )}
          </div>

          {/* Compact Mode Contact Info */}
          {variant === 'compact' && (
            <div className="mt-4 space-y-1">
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Phone className="h-3 w-3" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-3 print:bg-white print:border-black">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-500 print:text-black">
              <p>Kartu digital ini sah dan berlaku</p>
              <p>ID: {member.id}</p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={onDownload}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  title="Unduh kartu"
                >
                  <Download className="h-3 w-3" />
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  title="Cetak kartu"
                >
                  <Printer className="h-3 w-3" />
                </button>

                <button
                  onClick={onShare}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  title="Bagikan kartu"
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Print-specific watermark */}
        <div className="absolute inset-0 pointer-events-none print:block hidden">
          <div className="absolute bottom-4 right-4 text-xs text-neutral-300 transform rotate-12">
            KOPERASI SINOMAN
          </div>
        </div>
      </div>
    )
  }
)

MemberCard.displayName = 'MemberCard'

// Member Card Skeleton for loading states
export const MemberCardSkeleton = () => {
  return (
    <div className="max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-neutral-300 to-neutral-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 bg-white bg-opacity-30 rounded"></div>
            <div className="mt-2 h-4 w-32 bg-white bg-opacity-20 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full"></div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 bg-white bg-opacity-20 rounded-full"></div>
          <div className="h-6 w-20 bg-white bg-opacity-20 rounded-full"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-neutral-200 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-28 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-36 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-52 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 bg-neutral-200 rounded-lg animate-pulse"></div>
            <div className="mt-2 h-3 w-20 bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse"></div>
            <div className="mt-1 h-3 w-24 bg-neutral-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-6 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-6 w-6 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-6 w-6 bg-neutral-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberCard