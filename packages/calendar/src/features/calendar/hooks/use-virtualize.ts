import type { HorizontalGridRowProps } from '@/components/horizontal-grid/horizontal-grid-row'
import { useEffect, useState } from 'react'

export const calculateViewportWidth = (viewportRef: React.RefObject<HTMLDivElement | null>, setScrollLeft: React.Dispatch<React.SetStateAction<number>>) => {
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const onScroll = () => {
      setScrollLeft(viewport.scrollLeft)
    }

    viewport.addEventListener("scroll", onScroll)

    return () => viewport.removeEventListener("scroll", onScroll)
  }, [])
  const viewportWidth = viewportRef.current?.clientWidth ?? 0

  return viewportWidth
}

export const calculateVirtualizeIndex = (scrollLeft: number, viewportWidth: number, COLUMN_WIDTH: number, OVERSCAN: number) => {
  const startIndex = Math.max(
    0,
    Math.floor(scrollLeft / COLUMN_WIDTH) - OVERSCAN
  )
  const endIndex = Math.ceil(
    (scrollLeft + viewportWidth) / COLUMN_WIDTH + OVERSCAN
  )
  
  return { startIndex, endIndex }
}

export const calculateLeftPadding = (startIndex: number, COLUMN_WIDTH: number) => {
  const leftPadding = startIndex * COLUMN_WIDTH
  return leftPadding
}

export const calculateRightPadding = (daysLength: number, endIndex: number, COLUMN_WIDTH: number) => {
  const rightPadding = Math.max(0, (daysLength - endIndex) * COLUMN_WIDTH)
  return rightPadding
}

export const calculateSlicedRows = (visibleRows: HorizontalGridRowProps[], startIndex: number, endIndex: number) => {
  // Get the slicedRows
  const slicedRows = visibleRows.map(row => ({
    ...row,
    columns: row.columns?.slice(startIndex, endIndex),
  }))
  return slicedRows
}

export const useVirtualize = (getScrollElement: () => HTMLElement | null | undefined, viewportRef: React.RefObject<HTMLDivElement | null>, COLUMN_WIDTH: number = 80, OVERSCAN: number = 5, daysLength?: number) => {
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    const el = getScrollElement()
    if (!el) return

    setViewportWidth(el?.clientWidth ?? 0)

    const onScroll = () => {
        setScrollLeft(el.scrollLeft)
    }

    onScroll()

    el.addEventListener("scroll", onScroll)

    return () => el.removeEventListener("scroll", onScroll)
  }, [getScrollElement])

  // Getting the variable needed for showing only the visible part 
  // const viewportWidth = calculateViewportWidth(viewportRef, setScrollLeft)
  const { startIndex, endIndex } = calculateVirtualizeIndex(scrollLeft, viewportWidth, COLUMN_WIDTH, OVERSCAN)

  // For giving the visible rows and the left padding so that itll in the middle
  const leftPadding = calculateLeftPadding(startIndex, COLUMN_WIDTH)
  const rightPadding = daysLength ? calculateRightPadding(daysLength, endIndex, COLUMN_WIDTH) : 0

  return { viewportWidth, startIndex, endIndex, leftPadding, rightPadding }
}