import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdChatMessages, useCaerholdRelationship, useSendChatMessage } from '@/hooks/caerhold/useCaerholdChat';
import { RelationshipMeter } from '@/components/caerhold/RelationshipMeter';
import { useAuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';

export default function ResidentChat() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthContext();
  const { data: resident, isLoading: residentLoading } = useCaerholdResident(slug || '');
  const { data: messages, isLoading: messagesLoading } = useCaerholdChatMessages(resident?.id || '');
  const { data: relationship } = useCaerholdRelationship(resident?.id || '');
  const sendMessage = useSendChatMessage();

  const [input, setInput] = useState('');
  const [streamingMessages, setStreamingMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || !resident?.id || isStreaming) return;

    const userMsg = input.trim();
    setInput('');
    setIsStreaming(true);

    // Add user message to streaming display
    setStreamingMessages([{ role: 'user', content: userMsg }]);

    let assistantSoFar = '';

    try {
      await sendMessage.mutateAsync({
        residentId: resident.id,
        message: userMsg,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setStreamingMessages([
            { role: 'user', content: userMsg },
            { role: 'assistant', content: assistantSoFar },
          ]);
        },
        onDone: () => {
          // Don't clear yet - wait for refetch
        },
      });
    } catch (e: any) {
      toast({ title: 'Chat Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsStreaming(false);
      // Clear streaming messages after a brief delay for refetch
      setTimeout(() => setStreamingMessages([]), 1500);
    }
  };

  if (residentLoading) {
    return (
      <CaerholdLayout>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">Loading...</div>
      </CaerholdLayout>
    );
  }

  if (!resident) {
    return (
      <CaerholdLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Resident not found</p>
          <Link to="/caerhold/residents" className="text-primary hover:underline">Back to Residents</Link>
        </div>
      </CaerholdLayout>
    );
  }

  if (!user) {
    return (
      <CaerholdLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-lg font-medium">Sign in to chat with {resident.display_name}</p>
          <Link to="/admin/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </CaerholdLayout>
    );
  }

  // Combine persisted + streaming messages
  const allMessages = [
    ...(messages || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ...streamingMessages,
  ];

  const avatarUrl = (resident as any).avatar_url;

  return (
    <CaerholdLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center gap-3">
          <Link to={`/caerhold/residents/${slug}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} className="object-contain scale-[2] origin-center" />}
            <AvatarFallback>{resident.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm truncate">{resident.display_name}</h1>
            {resident.role_title && <p className="text-xs text-muted-foreground truncate">{resident.role_title}</p>}
          </div>
          <RelationshipMeter relationship={relationship ?? null} compact />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.length === 0 && !messagesLoading && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">Start a conversation with {resident.display_name}!</p>
              {resident.bio && <p className="text-xs mt-2 italic max-w-sm mx-auto">"{resident.bio}"</p>}
            </div>
          )}

          {allMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="h-7 w-7 shrink-0 mt-1">
                  {avatarUrl && <AvatarImage src={avatarUrl} className="object-contain scale-[2] origin-center" />}
                  <AvatarFallback className="text-[10px]">{resident.display_name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0 [&_p]:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isStreaming && streamingMessages[streamingMessages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2 items-start">
              <Avatar className="h-7 w-7 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} className="object-contain scale-[2] origin-center" />}
                <AvatarFallback className="text-[10px]">{resident.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Relationship meter (expanded) */}
        {relationship && (
          <div className="px-4 pb-2">
            <RelationshipMeter relationship={relationship} />
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Say something to ${resident.display_name}...`}
            disabled={isStreaming}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CaerholdLayout>
  );
}
