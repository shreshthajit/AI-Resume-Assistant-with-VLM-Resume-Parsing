"use client";

import { Plus, Loader2 } from "lucide-react";
import { ChatHistoryItem } from "@/types";

interface SidebarProps {
  chatHistory: ChatHistoryItem[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (resumeId: string) => void;
  isLoading?: boolean;
}

export default function Sidebar({ 
  chatHistory, 
  activeChat, 
  onNewChat, 
  onSelectChat,
  isLoading = false 
}: SidebarProps) {
  return (
    <div className="w-64 h-full bg-gray-100 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              New Chat
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-sm font-semibold text-gray-500 px-2 py-2">Recent Chats</h3>
        <div className="space-y-1">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            chatHistory.map((chat) => (
              <button
                key={chat.resume_id}
                onClick={() => onSelectChat(chat.resume_id)}
                disabled={isLoading}
                className={`w-full text-left p-2 rounded-lg text-sm truncate transition-colors ${
                  activeChat === chat.resume_id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-200'
                } ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="font-medium truncate">{chat.resume_name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {chat.last_message}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}