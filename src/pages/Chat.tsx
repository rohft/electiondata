import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const TABLE_ID = 74924;

interface Message {
  ID: number;
  user_email: string;
  user_name: string;
  message_text: string;
  timestamp: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserInfo();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data, error } = await window.ezsite.apis.getUserInfo();
      if (error) throw new Error(error);
      setUserInfo(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user info');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(TABLE_ID, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: []
      });
      if (error) throw new Error(error);
      setMessages(data.List || []);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userInfo) return;

    setLoading(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate(TABLE_ID, {
        user_email: userInfo.Email,
        user_name: userInfo.Name || userInfo.Email,
        message_text: newMessage.trim(),
        timestamp: new Date().toISOString()
      });

      if (error) throw new Error(error);

      setNewMessage('');
      await loadMessages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => {
    return userInfo && message.user_email === userInfo.Email;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Community Chat
            </h1>
          </div>
          <p className="text-slate-600">Connect and chat with other users in real-time</p>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <h2 className="font-semibold">Chat Room</h2>
            <p className="text-sm text-blue-100">
              Logged in as {userInfo?.Name || userInfo?.Email || 'Loading...'}
            </p>
          </div>

          <ScrollArea
            className="h-[500px] p-4"
            ref={scrollRef}
          >
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-20">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.ID}
                    className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMyMessage(message)
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white border border-slate-200'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            isMyMessage(message) ? 'text-blue-100' : 'text-slate-700'
                          }`}
                        >
                          {isMyMessage(message) ? 'You' : message.user_name}
                        </span>
                        <span
                          className={`text-xs ${
                            isMyMessage(message) ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-slate-50">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="resize-none min-h-[60px] max-h-[120px]"
                disabled={loading || !userInfo}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading || !userInfo}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
