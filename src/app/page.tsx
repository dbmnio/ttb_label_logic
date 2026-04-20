import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
          TTB Label Verification
        </h1>
        <p className="text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
          A high-performance, human-in-the-loop AI application designed to automate and assist the verification of alcohol beverage labels (TTB Form 5100.31).
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/ingestion" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-lg h-14 px-8">
              Submit New Label
            </Button>
          </Link>
          <Link href="/queue" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8">
              View Verification Queue
            </Button>
          </Link>
        </div>
        <div className="pt-4">
          <Link href="/history" className="text-primary hover:underline">
            View History & Audit Trail
          </Link>
        </div>
      </div>
    </div>
  )
}
