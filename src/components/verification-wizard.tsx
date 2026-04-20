'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { approveApplication, rejectApplication } from '@/app/verify/actions'
import { Badge } from '@/components/ui/badge'

interface ChecklistItem {
  value: string | boolean | null
  polygon_id: number | null
}

interface ChecklistData {
  [key: string]: ChecklistItem
}

interface RekognitionGeometry {
  BoundingBox?: {
    Width: number
    Height: number
    Left: number
    Top: number
  }
}

interface OcrItem {
  Id: number
  Type: string
  DetectedText: string
  Geometry?: RekognitionGeometry
}

interface VerificationWizardProps {
  applicationId: string
  imageUrl: string
  checklistData: ChecklistData
  rawOcrData: OcrItem[]
}

type ChecklistKey = keyof ChecklistData
type Status = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export default function VerificationWizard({
  applicationId,
  imageUrl,
  checklistData,
  rawOcrData
}: VerificationWizardProps) {
  // Convert checklist object to an array for step-by-step navigation
  const checklistKeys = useMemo(() => Object.keys(checklistData), [checklistData])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  
  // Track status of each item
  const [statuses, setStatuses] = useState<Record<string, Status>>(() => {
    const initial: Record<string, Status> = {}
    checklistKeys.forEach(k => initial[k] = 'PENDING')
    return initial
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const currentKey = checklistKeys[currentStepIndex]
  const currentItem = currentKey ? checklistData[currentKey] : null
  const currentPolygonId = currentItem?.polygon_id

  // Automatically zoom to the active polygon when the step changes
  useEffect(() => {
    if (currentPolygonId !== null && currentPolygonId !== undefined && transformRef.current) {
      const ocrItem = rawOcrData.find(item => item.Id === currentPolygonId)
      if (ocrItem && ocrItem.Geometry?.BoundingBox) {
        const box = ocrItem.Geometry.BoundingBox
        
        // The box coordinates are relative (0 to 1). 
        // react-zoom-pan-pinch exposes zoomToElement, but we have relative coords.
        // As a simple alternative, we will just use state to trigger a CSS transform 
        // or just let the user see the highlighted box.
        // For a true implementation, we'd calculate the absolute pixel values 
        // based on the original image size and call transformRef.current.setTransform(...)
      }
    }
  }, [currentPolygonId, rawOcrData])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'a':
        case 'A':
          if (currentKey) handleAccept(currentKey)
          break
        case 'm':
        case 'M':
          if (currentKey) handleReject(currentKey)
          break
        case 'ArrowRight':
          if (currentStepIndex < checklistKeys.length - 1) setCurrentStepIndex(prev => prev + 1)
          break
        case 'ArrowLeft':
          if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, currentKey, checklistKeys.length])

  const handleAccept = (key: string) => {
    setStatuses(prev => ({ ...prev, [key]: 'ACCEPTED' }))
    if (currentStepIndex < checklistKeys.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleReject = (key: string) => {
    setStatuses(prev => ({ ...prev, [key]: 'REJECTED' }))
    if (currentStepIndex < checklistKeys.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    const anyRejected = Object.values(statuses).some(s => s === 'REJECTED')
    
    if (anyRejected) {
      await rejectApplication(applicationId, 'Failed verification criteria')
    } else {
      await approveApplication(applicationId)
    }
  }

  const isComplete = Object.values(statuses).every(s => s !== 'PENDING')

  // Format key to readable label (e.g., 'brand_name' -> 'Brand Name')
  const formatLabel = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Checklist */}
      <div className="w-1/3 max-w-sm flex flex-col border-r bg-white h-full shrink-0">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-lg mb-1">Verification Checklist</h2>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span>Use keys:</span>
            <Badge variant="outline">A</Badge> Accept
            <Badge variant="outline">M</Badge> Modify
            <Badge variant="outline">← →</Badge> Nav
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {checklistKeys.map((key, index) => {
              const item = checklistData[key]
              const status = statuses[key]
              const isActive = index === currentStepIndex
              
              return (
                <div 
                  key={key} 
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    isActive ? 'border-primary ring-1 ring-primary/20 bg-blue-50/50' : 'bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {index + 1}. {formatLabel(key)}
                    </span>
                    {status === 'ACCEPTED' && <CheckCircle2 className="text-success h-5 w-5" />}
                    {status === 'REJECTED' && <XCircle className="text-error h-5 w-5" />}
                    {status === 'PENDING' && <div className="h-5 w-5 rounded-full border-2 border-slate-200" />}
                  </div>
                  
                  <div className="bg-slate-100 p-2 rounded text-sm mb-3 break-words font-mono">
                    {typeof item.value === 'boolean' 
                      ? (item.value ? 'Yes (Detected)' : 'No') 
                      : (item.value || 'Not Detected')}
                  </div>

                  {isActive && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant={status === 'ACCEPTED' ? 'default' : 'outline'}
                        className={`flex-1 ${status === 'ACCEPTED' ? 'bg-success hover:bg-success/90 text-white' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleAccept(key) }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant={status === 'REJECTED' ? 'destructive' : 'outline'}
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleReject(key) }}
                      >
                        <Flag className="mr-2 h-4 w-4" /> Modify
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t bg-slate-50">
          <Button 
            className="w-full" 
            size="lg" 
            disabled={!isComplete || isSubmitting}
            onClick={handleFinalSubmit}
            variant={Object.values(statuses).some(s => s === 'REJECTED') ? 'destructive' : 'default'}
          >
            {isSubmitting ? 'Submitting...' : 'Complete Review'}
          </Button>
        </div>
      </div>

      {/* Right Panel: Image Viewer */}
      <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <TransformWrapper 
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          centerOnInit={true}
        >
          <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
            <div className="relative max-w-full max-h-full inline-block">
              {/* Fallback mock image if none is passed or failing to load */}
              <img 
                src={imageUrl} 
                alt="Label" 
                className="max-w-full max-h-full object-contain shadow-2xl"
                onError={(e) => {
                  // Fallback for demo purposes if S3 image fails to load
                  e.currentTarget.src = 'https://placehold.co/600x800/e2e8f0/1e293b?text=Label+Image+Preview'
                }}
              />

              {/* Draw Bounding Boxes */}
              {rawOcrData.map((ocr) => {
                if (!ocr.Geometry?.BoundingBox) return null
                
                const box = ocr.Geometry.BoundingBox
                const isTarget = currentPolygonId === ocr.Id
                
                // Highlight polygons mapped to the CURRENT active step, or faintly show others
                // But typically we only show the current polygon, or we can show all lightly
                if (!isTarget && ocr.Type !== 'WORD') return null // Only show target for clarity

                return (
                  <div
                    key={ocr.Id}
                    style={{
                      position: 'absolute',
                      left: `${box.Left * 100}%`,
                      top: `${box.Top * 100}%`,
                      width: `${box.Width * 100}%`,
                      height: `${box.Height * 100}%`,
                    }}
                    className={`border-2 transition-all duration-300 pointer-events-none ${
                      isTarget 
                        ? 'border-yellow-400 bg-yellow-400/20 z-10 ring-4 ring-yellow-400/50' 
                        : 'border-blue-500/30'
                    }`}
                  />
                )
              })}
            </div>
          </TransformComponent>
        </TransformWrapper>
        
        {/* Helper overlay text */}
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
          Scroll to zoom • Drag to pan
        </div>
      </div>
    </div>
  )
}
