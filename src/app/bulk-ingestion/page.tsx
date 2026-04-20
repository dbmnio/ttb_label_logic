"use client";

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

export default function BulkIngestionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ message?: string; error?: string; details?: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/bulk-ingestion', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ error: data.error || 'Upload failed.', details: data.details })
      } else {
        setResult({ message: data.message, details: data.errors })
        setFile(null)
        // reset file input
        const fileInput = document.getElementById('zip-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      setResult({ error: 'Network error during upload.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bulk Ingestion</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Batch Archive</CardTitle>
          <CardDescription>
            Upload a .zip file containing a <strong>records.csv</strong> and the corresponding label images. 
            The background pipeline will automatically begin processing valid applications.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="zip-upload">Select .zip File</Label>
            <Input 
              id="zip-upload" 
              type="file" 
              accept=".zip,application/zip" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              CSV must have headers: <code>ttb_id, brand_name, alcohol_type, image_file</code>
            </p>
          </div>

          {result?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>
                {result.error}
                {result.details && result.details.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {result.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {result?.message && (
            <Alert className="bg-success/10 text-success-foreground border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.details && result.details.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-1 text-warning-foreground">Some records had issues:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-warning-foreground">
                      {result.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4">
                  <Link href="/queue">
                    <Button size="sm" variant="outline">View Queue</Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Archive...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload and Process
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
