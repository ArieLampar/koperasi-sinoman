'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Gift,
  Copy,
  Share2,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  UserPlus,
  ExternalLink,
  QrCode,
  Download,
  ChevronRight,
  Star,
  Trophy
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { useMemberData } from '@/hooks/use-member-data'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRelativeTime } from '@/lib/utils/date'

// Components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

// Types
interface ReferralStats {
  total_referrals: number
  active_referrals: number
  total_earnings: number
  pending_earnings: number
  this_month_referrals: number
  this_month_earnings: number
  referral_code: string
  referral_link: string
  rank: string
  next_rank: string
  progress_to_next_rank: number
}

interface ReferralHistory {
  id: string
  referred_name: string
  referred_email: string
  join_date: string
  status: 'pending' | 'active' | 'inactive'
  bonus_earned: number
  bonus_status: 'pending' | 'paid' | 'cancelled'
}

interface ReferralReward {
  id: string
  amount: number
  type: 'signup_bonus' | 'activity_bonus' | 'milestone_bonus'
  description: string
  date: string
  status: 'pending' | 'paid' | 'cancelled'
}

export default function ReferralPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: memberData } = useMemberData()

  // State
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralHistory[]>([])
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'rewards'>('overview')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch referral data
  useEffect(() => {
    if (user) {
      fetchReferralData()
    }
  }, [user])

  const fetchReferralData = async () => {
    setIsLoading(true)
    try {
      const [statsResponse, historyResponse, rewardsResponse] = await Promise.all([
        fetch('/api/referral/stats'),
        fetch('/api/referral/history'),
        fetch('/api/referral/rewards')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setHistory(historyData.data || [])
      }

      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json()
        setRewards(rewardsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      toast.error('Gagal memuat data referral')
    } finally {
      setIsLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code)
      toast.success('Kode referral disalin!')
    }
  }

  const copyReferralLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link)
      toast.success('Link referral disalin!')
    }
  }

  const shareReferral = async () => {
    if (!stats) return

    const shareData = {
      title: 'Bergabung dengan Koperasi Sinoman',
      text: `Hai! Yuk bergabung dengan Koperasi Sinoman menggunakan kode referral saya: ${stats.referral_code}. Dapatkan bonus menarik!`,
      url: stats.referral_link
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying link
        copyReferralLink()
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'bronze': return <Award className="h-5 w-5 text-amber-600" />
      case 'silver': return <Award className="h-5 w-5 text-gray-400" />
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'platinum': return <Star className="h-5 w-5 text-purple-500" />
      default: return <Users className="h-5 w-5 text-neutral-500" />
    }
  }

  // Show loading or redirect if not authenticated
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const isMember = memberData?.status === 'active'

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-secondary-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Program Referral Khusus Anggota
            </h2>
            <p className="text-neutral-600 mb-6">
              Hanya anggota aktif yang dapat menggunakan program referral. Silakan daftarkan diri Anda sebagai anggota terlebih dahulu.
            </p>
            <Button asChild>
              <Link href="/auth/register">
                Daftar Sebagai Anggota
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Program Referral
              </h1>
              <p className="text-neutral-600">
                Ajak teman dan dapatkan reward menarik untuk setiap referral yang berhasil!
              </p>
            </div>
            {stats && (
              <div className="flex items-center space-x-2">
                {getRankIcon(stats.rank)}
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 capitalize">
                    {stats.rank}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Rank Anda
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          /* Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-neutral-200 rounded mb-2" />
                  <div className="h-8 bg-neutral-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-600">Total Referral</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats.total_referrals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-success-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-600">Referral Aktif</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats.active_referrals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-accent-gold" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-600">Total Earning</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {formatCurrency(stats.total_earnings)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-secondary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-600">Bulan Ini</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {formatCurrency(stats.this_month_earnings)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Code & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Referral Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-primary-600" />
                    Kode & Link Referral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Referral Code */}
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Kode Referral</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 p-3 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-lg text-center">
                          {stats.referral_code}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyReferralCode}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Referral Link */}
                    <div>
                      <label className="text-sm font-medium text-neutral-700">Link Referral</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm truncate">
                          {stats.referral_link}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyReferralLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={shareReferral}
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Bagikan
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-accent-gold" />
                    Progress Rank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(stats.rank)}
                        <span className="font-medium capitalize">{stats.rank}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRankIcon(stats.next_rank)}
                        <span className="font-medium capitalize">{stats.next_rank}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-neutral-600 mb-2">
                        <span>Progress ke {stats.next_rank}</span>
                        <span>{Math.round(stats.progress_to_next_rank)}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.progress_to_next_rank}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Rank Benefits */}
                    <div className="bg-primary-50 rounded-lg p-4">
                      <h4 className="font-medium text-primary-900 mb-2">
                        Benefit {stats.next_rank}:
                      </h4>
                      <ul className="text-sm text-primary-700 space-y-1">
                        <li>• Bonus referral lebih tinggi</li>
                        <li>• Akses fitur premium</li>
                        <li>• Prioritas customer service</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-neutral-200">
              {/* Tab Navigation */}
              <div className="border-b border-neutral-200">
                <div className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'history', label: 'Riwayat Referral', icon: Users },
                    { id: 'rewards', label: 'Reward', icon: Gift }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* This Month Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Performa Bulan Ini
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <p className="text-sm text-neutral-600">Referral Baru</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {stats.this_month_referrals}
                          </p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <p className="text-sm text-neutral-600">Earning Bulan Ini</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {formatCurrency(stats.this_month_earnings)}
                          </p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <p className="text-sm text-neutral-600">Pending Reward</p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {formatCurrency(stats.pending_earnings)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* How it Works */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                        Cara Kerja Program Referral
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Share2 className="h-8 w-8 text-primary-600" />
                          </div>
                          <h4 className="font-medium text-neutral-900 mb-2">1. Bagikan</h4>
                          <p className="text-sm text-neutral-600">
                            Bagikan kode atau link referral Anda kepada teman dan keluarga
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="h-8 w-8 text-success-600" />
                          </div>
                          <h4 className="font-medium text-neutral-900 mb-2">2. Daftar</h4>
                          <p className="text-sm text-neutral-600">
                            Teman Anda mendaftar menggunakan kode referral yang Anda berikan
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift className="h-8 w-8 text-accent-gold" />
                          </div>
                          <h4 className="font-medium text-neutral-900 mb-2">3. Dapatkan Reward</h4>
                          <p className="text-sm text-neutral-600">
                            Anda dan teman Anda mendapatkan bonus setelah mereka aktif bertransaksi
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        Riwayat Referral
                      </h3>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    {history.length > 0 ? (
                      <div className="space-y-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">{item.referred_name}</p>
                                <p className="text-sm text-neutral-600">{item.referred_email}</p>
                                <p className="text-xs text-neutral-500">
                                  Bergabung {formatRelativeTime(item.join_date)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  item.status === 'active' ? 'default' :
                                  item.status === 'pending' ? 'secondary' : 'destructive'
                                }
                                className="mb-2"
                              >
                                {item.status === 'active' ? 'Aktif' :
                                 item.status === 'pending' ? 'Pending' : 'Tidak Aktif'}
                              </Badge>
                              <p className="font-medium text-neutral-900">
                                {formatCurrency(item.bonus_earned)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {item.bonus_status === 'paid' ? 'Dibayar' :
                                 item.bonus_status === 'pending' ? 'Pending' : 'Dibatalkan'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                          Belum Ada Referral
                        </h3>
                        <p className="text-neutral-600">
                          Mulai ajak teman dan dapatkan reward menarik!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'rewards' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        Riwayat Reward
                      </h3>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    {rewards.length > 0 ? (
                      <div className="space-y-4">
                        {rewards.map((reward) => (
                          <div
                            key={reward.id}
                            className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-accent-gold/20 rounded-full flex items-center justify-center">
                                <Gift className="h-5 w-5 text-accent-gold" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">{reward.description}</p>
                                <p className="text-sm text-neutral-600">
                                  {reward.type === 'signup_bonus' ? 'Bonus Registrasi' :
                                   reward.type === 'activity_bonus' ? 'Bonus Aktivitas' :
                                   'Bonus Milestone'}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {formatRelativeTime(reward.date)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent-gold text-lg">
                                {formatCurrency(reward.amount)}
                              </p>
                              <Badge
                                variant={
                                  reward.status === 'paid' ? 'default' :
                                  reward.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {reward.status === 'paid' ? 'Dibayar' :
                                 reward.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Gift className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                          Belum Ada Reward
                        </h3>
                        <p className="text-neutral-600">
                          Reward akan muncul setelah referral Anda aktif bertransaksi
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600">Gagal memuat data referral</p>
            <Button onClick={fetchReferralData} className="mt-4">
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}