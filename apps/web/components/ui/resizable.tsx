"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"
import React, { useRef, useEffect } from "react"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => {
  const handleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!handleRef.current) return

      // Only handle arrow keys
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        return
      }

      // Get the resize handle element
      const handle = handleRef.current.querySelector('[role="separator"]') as HTMLElement
      if (!handle) return

      e.preventDefault()

      // Simulate mouse down, move, and up for keyboard resizing
      const rect = handle.getBoundingClientRect()
      const isVertical = handle.getAttribute('data-panel-group-direction') === 'vertical'

      // Determine resize distance based on Shift key (25% vs 10%)
      const baseDistance = e.shiftKey ? 50 : 10
      const distance = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? baseDistance : -baseDistance

      // Create and dispatch mouse events to trigger the library's resize
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: isVertical ? rect.left : rect.left + distance,
        clientY: isVertical ? rect.top + distance : rect.top,
      })

      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: isVertical ? rect.left : rect.left + distance,
        clientY: isVertical ? rect.top + distance : rect.top,
      })

      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
      })

      handle.dispatchEvent(mouseDownEvent)
      document.dispatchEvent(mouseMoveEvent)
      document.dispatchEvent(mouseUpEvent)
    }

    const handleElement = handleRef.current
    if (handleElement) {
      handleElement.addEventListener('keydown', handleKeyDown)
      return () => handleElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={handleRef}>
      <ResizablePrimitive.PanelResizeHandle
        className={cn(
          "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 tabindex-0 cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
          className
        )}
        {...props}
        tabIndex={0}
        role="separator"
        aria-label={props['aria-label'] || 'Drag to resize, or use arrow keys (Shift for larger adjustments)'}
        aria-orientation={handleRef.current?.querySelector('[data-panel-group-direction=vertical]') ? 'vertical' : 'horizontal'}
      >
        {withHandle && (
          <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
            <GripVertical className="h-2.5 w-2.5" />
          </div>
        )}
      </ResizablePrimitive.PanelResizeHandle>
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
