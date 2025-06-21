"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Home, Users, Bell } from "lucide-react"

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">SocialApp</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Communities</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </Button>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}
