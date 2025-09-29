'use client'

import * as React from 'react'
import { MemberCard, MemberCardSkeleton } from './member-card'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

// Example member data
const exampleMembers = {
  regular: {
    id: 'mem_001',
    memberNumber: 'KS2024001',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '+62 812-3456-7890',
    address: 'Jl. Merdeka No. 123, RT 05/RW 02, Kelurahan Sukamaju, Kecamatan Bandung Utara, Kota Bandung, Jawa Barat 40123',
    joinDate: '2024-01-15',
    status: 'active' as const,
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    branch: 'Bandung Pusat',
    memberType: 'regular' as const
  },
  premium: {
    id: 'mem_002',
    memberNumber: 'KS2023045',
    name: 'Siti Rahayu',
    email: 'siti.rahayu@email.com',
    phone: '+62 821-9876-5432',
    address: 'Jl. Sudirman No. 456, Komplek Graha Indah Blok C-15, Kelurahan Menteng, Jakarta Pusat 10310',
    joinDate: '2023-03-20',
    status: 'active' as const,
    profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b2a9?w=150&h=150&fit=crop&crop=face',
    branch: 'Jakarta Pusat',
    memberType: 'premium' as const
  },
  board: {
    id: 'mem_003',
    memberNumber: 'KS2022010',
    name: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@koperasisinoman.com',
    phone: '+62 811-2233-4455',
    address: 'Jl. Gatot Subroto No. 789, Perumahan Elite Garden, Kelurahan Setiabudi, Jakarta Selatan 12920',
    joinDate: '2022-06-10',
    status: 'active' as const,
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    branch: 'Jakarta Pusat',
    memberType: 'board' as const
  },
  inactive: {
    id: 'mem_004',
    memberNumber: 'KS2023078',
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@email.com',
    phone: '+62 813-5566-7788',
    address: 'Jl. Diponegoro No. 321, Kelurahan Tegalsari, Surabaya, Jawa Timur 60262',
    joinDate: '2023-08-05',
    status: 'inactive' as const,
    branch: 'Surabaya',
    memberType: 'regular' as const
  }
}

export const MemberCardExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const [selectedMember, setSelectedMember] = React.useState(exampleMembers.regular)

  const handleDownload = (member: typeof selectedMember) => {
    // In a real app, this would generate and download a PDF or image
    console.log('Downloading member card for:', member.name)
    alert(`Mengunduh kartu anggota untuk ${member.name}`)
  }

  const handlePrint = (member: typeof selectedMember) => {
    // In a real app, this might open a print-optimized view
    console.log('Printing member card for:', member.name)
    window.print()
  }

  const handleShare = (member: typeof selectedMember) => {
    if (navigator.share) {
      navigator.share({
        title: `Kartu Anggota ${member.name}`,
        text: `Kartu anggota Koperasi Sinoman - ${member.name} (${member.memberNumber})`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      const shareText = `Kartu anggota Koperasi Sinoman - ${member.name} (${member.memberNumber})`
      navigator.clipboard.writeText(shareText)
      alert('Link kartu anggota telah disalin ke clipboard')
    }
  }

  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Member Card Component</h1>
        <p className="text-neutral-600">Digital member card with QR code and Koperasi Sinoman branding</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Component Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setSelectedMember(exampleMembers.regular)}
              variant={selectedMember === exampleMembers.regular ? 'default' : 'outline'}
            >
              Regular Member
            </Button>
            <Button
              onClick={() => setSelectedMember(exampleMembers.premium)}
              variant={selectedMember === exampleMembers.premium ? 'default' : 'outline'}
            >
              Premium Member
            </Button>
            <Button
              onClick={() => setSelectedMember(exampleMembers.board)}
              variant={selectedMember === exampleMembers.board ? 'default' : 'outline'}
            >
              Board Member
            </Button>
            <Button
              onClick={() => setSelectedMember(exampleMembers.inactive)}
              variant={selectedMember === exampleMembers.inactive ? 'default' : 'outline'}
            >
              Inactive Member
            </Button>
            <Button onClick={simulateLoading} variant="secondary">
              Simulate Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Member Card Variants */}
      <Tabs defaultValue="default" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="compact">Compact</TabsTrigger>
          <TabsTrigger value="print">Print Version</TabsTrigger>
          <TabsTrigger value="loading">Loading State</TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="space-y-4">
          <h3 className="text-lg font-semibold">Default Member Card</h3>
          <p className="text-neutral-600 mb-4">
            Full-featured member card with all information, QR code, and action buttons.
          </p>
          <div className="flex justify-center">
            <MemberCard
              member={selectedMember}
              onDownload={() => handleDownload(selectedMember)}
              onPrint={() => handlePrint(selectedMember)}
              onShare={() => handleShare(selectedMember)}
            />
          </div>
        </TabsContent>

        <TabsContent value="compact" className="space-y-4">
          <h3 className="text-lg font-semibold">Compact Member Card</h3>
          <p className="text-neutral-600 mb-4">
            Compact version suitable for smaller spaces, with condensed information layout.
          </p>
          <div className="flex justify-center">
            <MemberCard
              member={selectedMember}
              variant="compact"
              onDownload={() => handleDownload(selectedMember)}
              onPrint={() => handlePrint(selectedMember)}
              onShare={() => handleShare(selectedMember)}
            />
          </div>
        </TabsContent>

        <TabsContent value="print" className="space-y-4">
          <h3 className="text-lg font-semibold">Print-Optimized Version</h3>
          <p className="text-neutral-600 mb-4">
            Print-friendly version with optimized styling for physical printing.
            Use the print button to see the print layout.
          </p>
          <div className="flex justify-center">
            <MemberCard
              member={selectedMember}
              variant="print"
              onDownload={() => handleDownload(selectedMember)}
              onPrint={() => handlePrint(selectedMember)}
              onShare={() => handleShare(selectedMember)}
            />
          </div>
        </TabsContent>

        <TabsContent value="loading" className="space-y-4">
          <h3 className="text-lg font-semibold">Loading State</h3>
          <p className="text-neutral-600 mb-4">
            Skeleton loading state while member data is being fetched.
          </p>
          <div className="flex justify-center">
            {loading ? (
              <MemberCardSkeleton />
            ) : (
              <MemberCard
                member={selectedMember}
                onDownload={() => handleDownload(selectedMember)}
                onPrint={() => handlePrint(selectedMember)}
                onShare={() => handleShare(selectedMember)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Core Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>✅ QR code generation for member verification</li>
                <li>✅ Responsive design for all screen sizes</li>
                <li>✅ Print-optimized styling with CSS media queries</li>
                <li>✅ Multiple variants (default, compact, print)</li>
                <li>✅ Member status indicators with color coding</li>
                <li>✅ Member type badges (regular, premium, board)</li>
                <li>✅ Profile photo with fallback avatar</li>
                <li>✅ Complete contact information display</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Interactive Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>✅ Download member card functionality</li>
                <li>✅ Print member card with optimized layout</li>
                <li>✅ Share member card via Web Share API</li>
                <li>✅ Copy member number to clipboard</li>
                <li>✅ Loading skeleton for async data</li>
                <li>✅ Hover animations and transitions</li>
                <li>✅ Accessibility features (ARIA, keyboard nav)</li>
                <li>✅ Dark mode and high contrast support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Usage</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { MemberCard } from '@/components/ui/member-card'

<MemberCard
  member={{
    id: 'mem_001',
    memberNumber: 'KS2024001',
    name: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '+62 812-3456-7890',
    address: 'Jl. Merdeka No. 123...',
    joinDate: '2024-01-15',
    status: 'active',
    memberType: 'regular'
  }}
  onDownload={() => downloadCard()}
  onPrint={() => printCard()}
  onShare={() => shareCard()}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Compact Version</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<MemberCard
  member={memberData}
  variant="compact"
  showQR={false}
  showActions={false}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Loading State</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { MemberCardSkeleton } from '@/components/ui/member-card'

{loading ? <MemberCardSkeleton /> : <MemberCard member={data} />}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Print Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-neutral-600">
            <p>
              <strong>To print the member card:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Click the print button on any member card</li>
              <li>Ensure your browser's print settings are configured:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Enable "Background graphics" or "Print backgrounds"</li>
                  <li>Set margins to minimum or custom (1cm recommended)</li>
                  <li>Choose A4 paper size for best results</li>
                  <li>Portrait orientation works best</li>
                </ul>
              </li>
              <li>The card will automatically use print-optimized styling</li>
              <li>Interactive elements (buttons) will be hidden in print</li>
              <li>Colors and gradients are preserved with print color adjustment</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberCardExample