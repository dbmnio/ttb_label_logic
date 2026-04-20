export { default } from "next-auth/middleware"

export const config = { 
  matcher: [
    // Protect these specific routes:
    "/queue/:path*", 
    "/history/:path*", 
    "/verify/:path*", 
    "/bulk-ingestion/:path*", 
    "/ingestion/:path*"
  ] 
}
