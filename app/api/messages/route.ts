import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const messages = await sql`
      SELECT id, username, content, timestamp, is_anonymous
      FROM messages 
      ORDER BY timestamp ASC 
      LIMIT 100
    `

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      username: msg.username,
      content: msg.content,
      timestamp: msg.timestamp,
      isAnonymous: msg.is_anonymous,
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, username, content, timestamp, isAnonymous } = await request.json()

    await sql`
      INSERT INTO messages (id, username, content, timestamp, is_anonymous)
      VALUES (${id}, ${username}, ${content}, ${timestamp}, ${isAnonymous})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }
}
