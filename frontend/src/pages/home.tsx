"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Paperclip, LogOut, Plus } from "lucide-react";
import ResumeDisplay from "../components/resume/index";
import Sidebar from "../components/sidebar/index";
import type { ParsedResume, ChatHistoryItem } from "../types";

const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FilePreview {
  file: File;
  preview: string;
}

export default function ChatInterface() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      fetchChatHistory();
    }
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, parsedResume]);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.push("/");
      return {};
    }
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${apiBaseUrl}/v1/chat/resume-chats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadChatHistory = async (resumeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/v1/chat/history/${resumeId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setResumeId(resumeId);
        setParsedResume(data.resume_name);
        setMessages(
          data.messages.map((m: any) => ({
            id: `${m.message_type}-${Date.now()}`,
            role: m.message_type as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setResumeId(null);
    setMessages([]);
    setParsedResume(null);
    setFiles([]);
  };

  const handleSelectChat = (resumeId: string) => {
    loadChatHistory(resumeId);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    router.push("/");
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !isAuthenticated) return;

    setFiles([]);
    setResumeId(null);
    setParsedResume(null);

    const previews = Array.from(selectedFiles).map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setFiles(previews);

    const formData = new FormData();
    previews.forEach((f) => formData.append("file", f.file));

    setMessages((prev) => [
      ...prev,
      { id: `upload-${Date.now()}`, role: "assistant", content: "⏳ Processing your resume..." },
    ]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/resume/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      setResumeId(data.resume_id);

      const poll = async () => {
        try {
          const statusRes = await fetch(`${apiBaseUrl}/resume/status/${data.resume_id}`, {
            headers: getAuthHeaders(),
          });

          if (statusRes.status === 401) {
            handleLogout();
            return;
          }

          const status = await statusRes.json();

          if (status.status === "done") {
            setParsedResume(status.parsed_data);
            setMessages((prev) => [
              ...prev,
              {
                id: `done-${Date.now()}`,
                role: "assistant",
                content: "✅ Resume parsed successfully! You can now ask questions about it.",
              },
            ]);
            setLoading(false);
            fetchChatHistory(); // Refresh chat history after new upload
          } else {
            setTimeout(poll, 2000);
          }
        } catch (err) {
          console.error("Polling error:", err);
          setMessages((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, role: "assistant", content: "❌ Error checking resume status." },
          ]);
          setLoading(false);
        }
      };
      poll();
    } catch (err) {
      console.error("Upload error:", err);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "❌ Failed to upload resume. Please try again." },
      ]);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isAuthenticated) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          resume_id: resumeId,
          user_message: input,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      const assistantMessages = data.messages?.filter((m: any) => m.message_type === "assistant");
      const assistantMessage = assistantMessages?.[0]?.content || "I couldn't generate a response.";

      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", content: assistantMessage },
      ]);

      // Refresh chat history after new message
      fetchChatHistory();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "❌ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        chatHistory={chatHistory}
        activeChat={resumeId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="p-6 border-b bg-white shadow flex justify-between items-center">
          {/* Image section added before the heading */}
          <div className="flex items-center gap-4">
            <img
              src="/images/robot.jpg"  // Replace with your image path
              alt="AI Resume Assistant Icon"
              className="w-12 h-12 rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold text-blue-600">AI Resume Assistant</h1>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="max-w-4xl mx-auto">
            {parsedResume && <ResumeDisplay resume={parsedResume} />}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                <div
                  className={`px-4 py-2 rounded-lg shadow max-w-[80%] text-sm whitespace-pre-wrap ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : msg.content.startsWith("❌")
                        ? "bg-red-100 text-red-800"
                        : msg.content.startsWith("⏳") || msg.content.startsWith("✅")
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-200 text-gray-800"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="px-4 py-2 rounded-lg shadow max-w-[80%] bg-gray-200 text-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">Thinking...</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-600 hover:text-blue-600 transition-colors"
              disabled={loading}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={resumeId ? "Ask about your resume..." : "Upload a resume first..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !resumeId}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || !resumeId}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </form>
        </footer>
      </div>
    </div>
  );
}