"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/ui/logo"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

export default function SignupPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)

    const password = form.get("password") as string
    const confirmPassword = form.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const body = {
      name: `${form.get("firstName")} ${form.get("lastName")}`,
      email: form.get("email"),
      password,
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || "Registration failed")
      }

      setSuccess(true)

      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* LEFT */}
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                {/* LOGO */}
                <div className="flex justify-center mb-2">
                  <Link href="/" className="flex items-center gap-2 font-medium">
                    <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                      <Logo size={20} />
                    </div>
                    <span className="text-xl">Accremo</span>
                  </Link>
                </div>

                {/* HEADER */}
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Create your account</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your information to create a new account
                  </p>
                </div>

                {/* NAME */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>First Name</Label>
                    <Input name="firstName" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last Name</Label>
                    <Input name="lastName" required />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" required />
                </div>

                {/* PASSWORD */}
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input name="password" type="password" required />
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="grid gap-2">
                  <Label>Confirm Password</Label>
                  <Input name="confirmPassword" type="password" required />
                </div>

                {/* TERMS */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <a href="#" className="underline underline-offset-4">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline underline-offset-4">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                {/* SUBMIT */}
                <Button disabled={loading} className="w-full">
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                {success && (
                  <p className="text-sm text-green-600 text-center">
                    Account created! Redirecting to login…
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-600 text-center">{error}</p>
                )}

                {/* LOGIN LINK */}
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>

            {/* RIGHT IMAGE */}
            <div className="bg-muted relative hidden md:block">
              <Image
                src="https://ui.shadcn.com/placeholder.svg"
                alt="Signup"
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* FOOTER TEXT */}
        <div className="text-muted-foreground text-center text-xs mt-4">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4">
            Privacy Policy
          </a>.
        </div>
      </div>
    </div>
  )
}
