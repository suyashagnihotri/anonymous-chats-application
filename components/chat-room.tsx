"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Send, Users, MessageCircle, Smile, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

interface Message {
  id: string
  username: string
  content: string
  timestamp: string
  isAnonymous: boolean
}

interface User {
  id: string
  username: string
  isAnonymous: boolean
}

interface ChatRoomProps {
  user: User
  onLogout: () => void
}

export function ChatRoom({ user, onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatHistory()
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [user])

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/messages")
      if (response.ok) {
        const history = await response.json()
        setMessages(history)
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/websocket`

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      setIsConnected(true)
      wsRef.current?.send(
        JSON.stringify({
          type: "user_join",
          user: user,
        }),
      )
    }

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "message":
          setMessages((prev) => [...prev, data.message])
          break
        case "user_joined":
          setOnlineUsers(data.users)
          toast({
            title: "👋 New User",
            description: `${data.username} joined the chat`,
            className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
          })
          break
        case "user_left":
          setOnlineUsers(data.users)
          break
        case "users_update":
          setOnlineUsers(data.users)
          break
      }
    }

    wsRef.current.onclose = () => {
      setIsConnected(false)
      setTimeout(connectWebSocket, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
      setIsConnected(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    const message = {
      id: Date.now().toString(),
      username: user.username,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isAnonymous: user.isAnonymous,
    }

    wsRef.current?.send(
      JSON.stringify({
        type: "message",
        message: message,
      }),
    )

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })
    } catch (error) {
      console.error("Failed to save message:", error)
    }

    setNewMessage("")
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-blue-500 to-cyan-500",
      "bg-gradient-to-br from-green-500 to-emerald-500",
      "bg-gradient-to-br from-orange-500 to-red-500",
      "bg-gradient-to-br from-indigo-500 to-purple-500",
      "bg-gradient-to-br from-pink-500 to-rose-500",
    ]
    const index = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-2rem)] relative z-10">
        {/* Online Users Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1 order-2 lg:order-1"
        >
          <Card className="h-full backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Online ({onlineUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-32 lg:h-[calc(100vh-16rem)]">
                <div className="space-y-3">
                  <AnimatePresence>
                    {onlineUsers.map((onlineUser, index) => (
                      <motion.div
                        key={onlineUser.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={`${getAvatarColor(onlineUser.username)} text-white text-xs font-bold`}
                          >
                            {onlineUser.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{onlineUser.username}</p>
                          {onlineUser.isAnonymous && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                            >
                              Anonymous
                            </Badge>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 order-1 lg:order-2 flex flex-col"
        >
          <Card className="h-full backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl flex flex-col">
            {/* Header */}
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Anonymous Chat Room</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-green-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm text-gray-300">{isConnected ? "Connected" : "Reconnecting..."}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-white hover:bg-white/10"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {user.username}
                  {user.isAnonymous && " (Anon)"}
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.username === user.username ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-start gap-3 max-w-xs lg:max-w-md ${
                            message.username === user.username ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback
                              className={`${getAvatarColor(message.username)} text-white text-xs font-bold`}
                            >
                              {message.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div
                            className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                              message.username === user.username
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : "bg-white/20 text-white border border-white/20"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 mb-1 ${
                                message.username === user.username ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="text-xs font-medium opacity-80">
                                {message.username === user.username ? "You" : message.username}
                              </span>
                              {message.isAnonymous && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-purple-500/30 text-purple-200 border-purple-400/30"
                                >
                                  Anon
                                </Badge>
                              )}
                              <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-white/10 p-6">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={!isConnected}
                      maxLength={500}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 transition-all duration-300 transform hover:scale-105"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <span>{newMessage.length}/500</span>
                  <span>Press Enter to send</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
