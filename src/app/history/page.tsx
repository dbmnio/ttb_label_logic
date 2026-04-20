import { prisma } from '@/lib/prisma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function HistoryPage(props: PageProps) {
  const searchParams = await props.searchParams
  const query = searchParams.query || ''

  // Only show processed (or potentially rejected if we track them separately)
  // For now, let's just query everything and let them search
  const applications = await prisma.application.findMany({
    where: {
      status: 'PROCESSED',
      OR: [
        { ttb_id: { contains: query, mode: 'insensitive' } },
        { brand_name: { contains: query, mode: 'insensitive' } },
      ]
    },
    orderBy: { updated_at: 'desc' }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">History & Audit Trail</h1>
        
        {/* Search Form */}
        <form action="/history" className="flex w-full md:max-w-sm items-center space-x-2">
          <Input 
            type="text" 
            name="query" 
            placeholder="Search by TTB ID or Brand Name..." 
            defaultValue={query} 
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TTB ID</TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>Alcohol Type</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.ttb_id}</TableCell>
                  <TableCell>{app.brand_name}</TableCell>
                  <TableCell>{app.alcohol_type.replace('_', ' ')}</TableCell>
                  <TableCell>{new Date(app.updated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/api/pdf/${app.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
