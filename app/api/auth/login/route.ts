import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { username, isAnonymous } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Create or update user in database
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO users (id, username, is_anonymous, last_active, created_at)
      VALUES (${userId}, ${username}, ${isAnonymous}, NOW(), NOW())
      ON CONFLICT (username) 
      DO UPDATE SET last_active = NOW()
    `

    const user = {
      id: userId,
      username,
      isAnonymous,
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
