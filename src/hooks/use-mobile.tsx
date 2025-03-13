
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on mount
    onChange()
    
    // Add event listener
    mql.addEventListener("change", onChange)
    
    // Handle orientation changes explicitly on mobile devices
    window.addEventListener("orientationchange", onChange)
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener("orientationchange", onChange)
    }
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(
    typeof window !== 'undefined' ? 
      (window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT) : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const checkSize = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    // Check on mount
    checkSize()
    
    // Add event listener
    window.addEventListener("resize", checkSize)
    window.addEventListener("orientationchange", checkSize)
    
    return () => {
      window.removeEventListener("resize", checkSize)
      window.removeEventListener("orientationchange", checkSize)
    }
  }, [])

  return isTablet
}

export function useDeviceSize() {
  const [size, setSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // Use a debounce function to avoid excessive updates
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 100) // 100ms debounce
    }
    
    // Initialize
    handleResize()
    
    // Add event listeners
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", () => {
      // Wait slightly longer for orientation changes as they can take longer
      setTimeout(handleResize, 200)
    })
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  return {
    width: size.width,
    height: size.height,
    isMobile: size.width < MOBILE_BREAKPOINT,
    isTablet: size.width >= MOBILE_BREAKPOINT && size.width < TABLET_BREAKPOINT,
    isDesktop: size.width >= TABLET_BREAKPOINT,
  }
}
