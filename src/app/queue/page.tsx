import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { lockAndSelectApplication } from './actions'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function QueuePage(props: PageProps) {
  const searchParams = await props.searchParams
  const filter = searchParams.filter

  const whereClause: any = {
    status: { in: ['PENDING', 'PROCESSING', 'READY'] }
  }
  
  if (filter && ['MALT_BEVERAGE', 'WINE', 'DISTILLED_SPIRITS'].includes(filter)) {
    whereClause.alcohol_type = filter
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    orderBy: { created_at: 'asc' }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Application Queue</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/queue">
            <Button variant={!filter ? 'default' : 'outline'}>All</Button>
          </Link>
          <Link href="/queue?filter=MALT_BEVERAGE">
            <Button variant={filter === 'MALT_BEVERAGE' ? 'default' : 'outline'}>Malt Beverage</Button>
          </Link>
          <Link href="/queue?filter=WINE">
            <Button variant={filter === 'WINE' ? 'default' : 'outline'}>Wine</Button>
          </Link>
          <Link href="/queue?filter=DISTILLED_SPIRITS">
            <Button variant={filter === 'DISTILLED_SPIRITS' ? 'default' : 'outline'}>Distilled Spirits</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map(app => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>{app.brand_name}</CardTitle>
              <CardDescription>TTB ID: {app.ttb_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Type:</strong> {app.alcohol_type.replace('_', ' ')}</p>
              <p><strong>Status:</strong> <span className="font-semibold text-primary">{app.status}</span></p>
              {app.user_id && (
                <Alert variant="destructive" className="mt-4 py-2">
                  <AlertTriangle className="h-4 w-4 mt-0" />
                  <AlertDescription>
                    Warning: User {app.user_id} is currently working on this.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <form action={lockAndSelectApplication.bind(null, app.id)} className="w-full">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-navy"
                  disabled={app.status !== 'READY'}
                >
                  {app.status === 'READY' ? 'Verify Label (Ready)' : 'Processing...'}
                </Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {applications.length === 0 && (
        <p className="text-muted-foreground text-center py-10">No applications in the queue matching your filter.</p>
      )}
    </div>
  )
}