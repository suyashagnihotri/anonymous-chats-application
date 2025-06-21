"use client";

import { useState } from "react";
import {
  SendHorizonal,
  MessageSquareText,
  Users,
  Shield,
  Lightbulb,
  Plus
} from "lucide-react";

type ChatMessage = { text: string; time: string };

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [anonymousMessages, setAnonymousMessages] = useState<ChatMessage[]>([]);
  const [communityMode, setCommunityMode] = useState(false);
  const [communities, setCommunities] = useState<string[]>([]);
  const [communityName, setCommunityName] = useState("");
  const [currentCommunity, setCurrentCommunity] = useState<string | null>(null);
  const [communityMessages, setCommunityMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleAuth = () => {
    if (username.trim() && password.trim()) {
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setChatStarted(false);
    setCommunityMode(false);
    setCurrentCommunity(null);
  };

  const handleCreateCommunity = () => {
    const name = communityName.trim();
    if (!name || communities.includes(name)) return;
    setCommunities(prev => [...prev, name]);
    setCommunityMessages(prev => ({ ...prev, [name]: [] }));
    setCommunityName("");
  };

  const handleSendAnonymousMessage = () => {
    if (!input.trim()) return;
    setAnonymousMessages(prev => [...prev, { text: input, time: getTime() }]);
    setInput("");
  };

  const handleSendCommunityMessage = () => {
    if (!input.trim() || !currentCommunity) return;
    setCommunityMessages(prev => ({
      ...prev,
      [currentCommunity]: [...prev[currentCommunity], { text: input, time: getTime() }]
    }));
    setInput("");
  };

  const bgStyle = {
    backgroundImage: "url('/background.jpg')"
  };

  return (
    <main
      className="p-4 sm:p-8 md:p-12 bg-cover bg-center min-h-screen"
      style={bgStyle}
    >
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto bg-white/80 p-6 rounded shadow">
          <h1 className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">
            {showLogin ? "Login" : "Sign Up"}
          </h1>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="border rounded px-4 py-2 text-black"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="border rounded px-4 py-2 text-black"
            />
            <button
              onClick={handleAuth}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              {showLogin ? "Login" : "Sign Up"}
            </button>
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="text-sm text-blue-600 underline"
            >
              {showLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      ) : chatStarted ? (
        <div className="bg-white/80 p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold">
              Anonymous Chat
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 underline"
            >
              Logout
            </button>
          </div>

          <div className="border rounded p-4 h-64 mb-4 overflow-y-auto bg-gray-100 flex flex-col gap-2">
            {anonymousMessages.length === 0 ? (
              <p className="text-gray-500 italic">No messages yet. Start the conversation!</p>
            ) : (
              anonymousMessages
                .slice()
                .reverse()
                .map((msg, idx) => (
                  <div key={idx} className="bg-blue-100 rounded p-2 text-black">
                    <div>{msg.text}</div>
                    <div className="text-xs text-gray-600">{msg.time}</div>
                  </div>
                ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow border rounded px-4 py-2 text-black"
              onKeyDown={e => e.key === "Enter" && handleSendAnonymousMessage()}
            />
            <button
              onClick={handleSendAnonymousMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              <SendHorizonal className="w-4 h-4" /> Send
            </button>
          </div>

          <button
            className="mt-4 text-sm text-blue-600 underline"
            onClick={() => setChatStarted(false)}
          >
            Back to Home
          </button>
        </div>
      ) : communityMode && !currentCommunity ? (
        <div className="bg-white/80 p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold">
              Communities
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 underline"
            >
              Logout
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={communityName}
              onChange={e => setCommunityName(e.target.value)}
              placeholder="Enter community name..."
              className="border rounded px-4 py-2 flex-grow text-black"
            />
            <button
              onClick={handleCreateCommunity}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {communities.length === 0 ? (
              <p className="text-gray-500 italic">No communities yet. Create one above!</p>
            ) : (
              communities.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentCommunity(c)}
                  className="border rounded p-2 text-left hover:bg-blue-50"
                >
                  {c}
                </button>
              ))
            )}
          </div>

          <button
            className="mt-4 text-sm text-blue-600 underline"
            onClick={() => setCommunityMode(false)}
          >
            Back to Home
          </button>
        </div>
      ) : currentCommunity ? (
        <div className="bg-white/80 p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold">
              {currentCommunity} Chat
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 underline"
            >
              Logout
            </button>
          </div>

          <div className="border rounded p-4 h-64 mb-4 overflow-y-auto bg-gray-100 flex flex-col gap-2">
            {communityMessages[currentCommunity].length === 0 ? (
              <p className="text-gray-500 italic">No messages yet. Start the conversation!</p>
            ) : (
              communityMessages[currentCommunity]
                .slice()
                .reverse()
                .map((msg, idx) => (
                  <div key={idx} className="bg-blue-100 rounded p-2 text-black">
                    <div>{msg.text}</div>
                    <div className="text-xs text-gray-600">{msg.time}</div>
                  </div>
                ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow border rounded px-4 py-2 text-black"
              onKeyDown={e => e.key === "Enter" && handleSendCommunityMessage()}
            />
            <button
              onClick={handleSendCommunityMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              <SendHorizonal className="w-4 h-4" /> Send
            </button>
          </div>

          <button
            className="mt-4 text-sm text-blue-600 underline"
            onClick={() => setCurrentCommunity(null)}
          >
            Back to Communities
          </button>
        </div>
      ) : (
        <div className="bg-white/80 p-4 rounded shadow text-center">
          <h1 className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Welcome
          </h1>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <button
              onClick={() => setChatStarted(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              Start Anonymous Chat
            </button>
            <button
              onClick={() => setCommunityMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-800"
            >
              Explore Communities
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 underline mt-2 sm:mt-0"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
