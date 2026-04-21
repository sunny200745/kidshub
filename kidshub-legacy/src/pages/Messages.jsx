import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Palette } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Avatar } from '../components/ui';
import { messages as initialMessages, myChildren } from '../data/mockData';

function MessageBubble({ message }) {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (message.isFromMe) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-brand">
            <p className="text-sm">{message.content}</p>
          </div>
          <p className="text-[11px] text-surface-400 text-right mt-1.5">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <Avatar name={message.senderName} size="sm" className="flex-shrink-0 mt-1" />
      <div className="max-w-[85%] sm:max-w-[70%]">
        <p className="text-xs text-surface-500 mb-1.5">{message.senderName}</p>
        <div className="bg-white border border-surface-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
          <p className="text-sm text-surface-900">{message.content}</p>
          {message.hasAttachment && (
            <div className="mt-3 p-2 bg-surface-50 rounded-xl">
              <div className="w-40 h-40 bg-surface-100 rounded-lg flex items-center justify-center">
                <Palette className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-xs text-surface-500 mt-2">Art project photo</p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-surface-400 mt-1.5">{time}</p>
      </div>
    </div>
  );
}

export default function Messages() {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const child = myChildren[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: `msg-${Date.now()}`,
      senderId: 'parent-1',
      senderName: 'Me',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isFromMe: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <Layout title="Messages" subtitle="Chat with teachers">
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          {/* Teacher Info Header */}
          <div className="bg-white border-b border-surface-100 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar name="Sarah Mitchell" size="md" />
              <div className="flex-1">
                <h3 className="font-medium text-surface-900">Sarah Mitchell</h3>
                <p className="text-xs text-surface-500">Lead Teacher • {child.classroom}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                <span className="text-xs text-surface-500">Online</span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <CardBody className="h-[400px] sm:h-[500px] overflow-y-auto bg-surface-50 p-4 sm:p-6 scrollbar-thin">
            <div className="text-center mb-6">
              <span className="text-xs text-surface-400 bg-white px-3 py-1.5 rounded-full shadow-soft">
                Today
              </span>
            </div>

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </CardBody>

          {/* Input Area */}
          <div className="bg-white border-t border-surface-100 p-3 sm:p-4">
            <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3">
              <button
                type="button"
                className="p-2.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
              
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 bg-surface-100 rounded-2xl text-sm text-surface-900 placeholder:text-surface-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-brand transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
