import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      return !!token
    },
  },
})

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
