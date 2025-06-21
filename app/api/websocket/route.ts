import type { NextRequest } from "next/server"

const connections = new Map<string, any>()
const users = new Map<string, any>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  return new Response("WebSocket endpoint - Use a proper WebSocket client", {
    status: 426,
    headers: {
      Upgrade: "websocket",
    },
  })
}
