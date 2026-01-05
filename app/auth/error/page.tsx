import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Error</h2>
          <p className="text-slate-600 mb-6">
            Something went wrong during authentication. Please try again.
          </p>
          <div className="space-y-2">
            <Link href="/auth/login">
              <Button className="w-full" size="lg">
                Back to Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full" size="lg">
                Create New Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
