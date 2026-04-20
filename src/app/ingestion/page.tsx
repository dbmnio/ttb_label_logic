'use client'

import { useState } from 'react'
import { submitApplication } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function IngestionPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const res = await submitApplication(formData)
      if (res.success) {
        toast.success('Application submitted successfully')
        router.push('/queue')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Submit TTB Form 5100.31</CardTitle>
          <CardDescription>
            Application for and Certification/Exemption of Label/Bottle Approval
          </CardDescription>
        </CardHeader>
        <form action={onSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ttbId">TTB ID</Label>
              <Input id="ttbId" name="ttbId" required placeholder="e.g. 23123001000123" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input id="brandName" name="brandName" required placeholder="e.g. Mountain Brew" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alcoholType">Alcohol Type</Label>
              <Select name="alcoholType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALT_BEVERAGE">Malt Beverage</SelectItem>
                  <SelectItem value="WINE">Wine</SelectItem>
                  <SelectItem value="DISTILLED_SPIRITS">Distilled Spirits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frontLabel">Front Label Image</Label>
              <Input id="frontLabel" name="frontLabel" type="file" accept="image/*" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backLabel">Back Label Image (Optional)</Label>
              <Input id="backLabel" name="backLabel" type="file" accept="image/*" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}