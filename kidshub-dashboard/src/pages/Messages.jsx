import React, { useState } from 'react';
import { Send, Search, MoreVertical, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Avatar, Button, IconButton, Input, LoadingPage, EmptyState, ConfirmDialog } from '../components/ui';
import { useMessagesData, useChildrenData, useParentsData, useStaffData } from '../hooks';
import { messagesApi } from '../firebase/api';

function ConversationList({ conversations, selectedId, onSelect, children, parents }) {
  return (
    <div className="divide-y divide-surface-100">
      {conversations.map((conv) => {
        const child = children?.find(c => c.id === conv.childId);
        const lastMessage = conv.messages[conv.messages.length - 1];
        const isUnread = conv.messages.some(
          (m) => !m.read && m.senderType === 'parent'
        );

        const formatTime = (timestamp) => {
          const date = new Date(timestamp);
          const now = new Date();
          const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          } else if (diffDays === 1) {
            return 'Yesterday';
          } else {
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }
        };

        return (
          <button
            key={conv.conversationId}
            onClick={() => onSelect(conv.conversationId)}
            className={`w-full p-3 sm:p-4 text-left hover:bg-surface-50 transition-colors ${
              selectedId === conv.conversationId ? 'bg-brand-50' : ''
            }`}
          >
            <div className="flex gap-3">
              <Avatar
                name={child ? `${child.firstName} ${child.lastName}` : 'Unknown'}
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-surface-900 truncate text-sm sm:text-base">
                    {child?.firstName} {child?.lastName}
                  </h4>
                  <span className="text-xs text-surface-400 ml-2 flex-shrink-0">
                    {formatTime(lastMessage.timestamp)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-surface-500 truncate mt-0.5">
                  {lastMessage.senderType === 'staff' ? 'You: ' : ''}
                  {lastMessage.content}
                </p>
              </div>
              {isUnread && (
                <span className="w-2.5 h-2.5 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MessageBubble({ message, parents, staff, onDelete }) {
  const sender =
    message.senderType === 'parent'
      ? parents?.find(p => p.id === message.senderId)
      : staff?.find(s => s.id === message.senderId);
  const isOwn = message.senderType === 'staff';

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`group flex gap-2 sm:gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <Avatar
          name={sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown'}
          size="sm"
          className="flex-shrink-0"
        />
      )}
      <div className={`max-w-[80%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${
              isOwn
                ? 'bg-brand-500 text-white rounded-br-md'
                : 'bg-surface-100 text-surface-900 rounded-bl-md'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message)}
              className="p-1 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              aria-label="Delete message">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className={`text-xs text-surface-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function ChatView({ conversation, children, parents, staff, onBack, onDeleteMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const child = children?.find(c => c.id === conversation?.childId);
  const parentId = conversation?.messages.find((m) => m.senderType === 'parent')?.senderId;
  const parent = parentId ? parents?.find(p => p.id === parentId) : null;

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    try {
      await messagesApi.sendFromStaff(
        'staff-1',
        parentId,
        conversation.childId,
        conversation.conversationId,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-surface-400 p-4">
        <EmptyState
          icon={MessageSquare}
          title="Select a conversation"
          description="Choose a conversation from the list to start messaging"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-100">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-surface-100"
            >
              <ArrowLeft className="w-5 h-5 text-surface-500" />
            </button>
          )}
          <Avatar
            name={child ? `${child.firstName} ${child.lastName}` : 'Unknown'}
            size="md"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-surface-900 text-sm sm:text-base truncate">
              {child?.firstName} {child?.lastName}
            </h3>
            <p className="text-xs sm:text-sm text-surface-500 truncate">
              {parent?.firstName} {parent?.lastName} ({parent?.relationship})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton icon={MoreVertical} variant="ghost" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            parents={parents}
            staff={staff}
            onDelete={onDeleteMessage}
          />
        ))}
      </div>

      {/* Message Input */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-surface-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button 
            icon={Send} 
            disabled={!newMessage.trim()}
            onClick={handleSend}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const { data: messages, loading: messagesLoading } = useMessagesData();
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: parents, loading: parentsLoading } = useParentsData();
  const { data: staff, loading: staffLoading } = useStaffData();
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(null);

  const loading = messagesLoading || childrenLoading || parentsLoading || staffLoading;

  // Group messages by conversation
  const conversationsMap = messages?.reduce((acc, message) => {
    if (!acc[message.conversationId]) {
      acc[message.conversationId] = {
        conversationId: message.conversationId,
        childId: message.childId,
        messages: [],
      };
    }
    acc[message.conversationId].messages.push(message);
    return acc;
  }, {}) || {};

  const conversations = Object.values(conversationsMap).sort((a, b) => {
    const aLastMessage = a.messages[a.messages.length - 1];
    const bLastMessage = b.messages[b.messages.length - 1];
    return new Date(bLastMessage.timestamp) - new Date(aLastMessage.timestamp);
  });

  const filteredConversations = conversations.filter((conv) => {
    const child = children?.find(c => c.id === conv.childId);
    return `${child?.firstName} ${child?.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const selectedConv = conversations.find(
    (c) => c.conversationId === selectedConversation
  );

  const unreadCount = messages?.filter(
    (m) => !m.read && m.senderType === 'parent'
  ).length || 0;

  const handleSelectConversation = (convId) => {
    setSelectedConversation(convId);
    setShowChat(true);
  };

  if (loading) {
    return (
      <Layout title="Messages" subtitle="Loading...">
        <LoadingPage message="Loading messages..." />
      </Layout>
    );
  }

  return (
    <Layout title="Messages" subtitle={`${unreadCount} unread messages`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-180px)]">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 overflow-hidden ${showChat ? 'hidden lg:block' : ''}`}>
          <div className="p-3 sm:p-4 border-b border-surface-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />
              <input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-surface-50 border-0 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {filteredConversations.length > 0 ? (
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedConversation}
                onSelect={handleSelectConversation}
                children={children}
                parents={parents}
              />
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations"
                  description="Start a conversation with a parent"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Chat View */}
        <Card className={`lg:col-span-2 overflow-hidden ${!showChat ? 'hidden lg:block' : ''}`}>
          <ChatView
            conversation={selectedConv}
            children={children}
            parents={parents}
            staff={staff}
            onBack={() => setShowChat(false)}
            onDeleteMessage={setDeletingMessage}
          />
        </Card>
      </div>

      <ConfirmDialog
        isOpen={!!deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={async () => {
          await messagesApi.delete(deletingMessage.id);
        }}
        title="Delete message"
        message={
          deletingMessage
            ? `This will permanently remove the message "${
                deletingMessage.content?.length > 80
                  ? `${deletingMessage.content.slice(0, 80)}…`
                  : deletingMessage.content
              }". The other participant will no longer see it either.`
            : ''
        }
        confirmLabel="Delete message"
      />
    </Layout>
  );
}
