"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MessageCircle, User, UserX, Sparkles, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface LoginFormProps {
  onLogin: (username: string, isAnonymous?: boolean) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent, isAnonymous = false) => {
    e.preventDefault()
    if (!isAnonymous && !username.trim()) return

    setIsLoading(true)
    await onLogin(isAnonymous ? `Anonymous_${Date.now()}` : username.trim(), isAnonymous)
    setIsLoading(false)
  }

  const handleAnonymousLogin = () => {
    handleSubmit(new Event("submit") as any, true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <MessageCircle className="w-10 h-10 text-white" />
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Anonymous Chat
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">Connect instantly, chat anonymously</CardDescription>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <Shield className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Secure</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Instant</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Anonymous</p>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200 font-medium">
                  Choose Your Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  maxLength={20}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                disabled={!username.trim() || isLoading}
              >
                <User className="w-4 h-4 mr-2" />
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  "Join with Username"
                )}
              </Button>
            </motion.form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-gray-400 font-medium">Or</span>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                onClick={handleAnonymousLogin}
                disabled={isLoading}
              >
                <UserX className="w-4 h-4 mr-2" />
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  "Join Anonymously"
                )}
              </Button>
            </motion.div>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              By joining, you agree to our community guidelines.
              <br />
              Be respectful and have fun! 🎉
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
