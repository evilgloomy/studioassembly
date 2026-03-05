import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { CaerholdChatMessage, CaerholdVisitorRelationship } from '@/types/caerhold';

export function useCaerholdChatMessages(residentId: string) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['caerhold-chat-messages', residentId, user?.id],
    queryFn: async () => {
      if (!user?.id || !residentId) return [];
      const { data, error } = await supabase
        .from('caerhold_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('resident_id', residentId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as CaerholdChatMessage[];
    },
    enabled: !!user?.id && !!residentId,
  });
}

export function useCaerholdRelationship(residentId: string) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['caerhold-relationship', residentId, user?.id],
    queryFn: async () => {
      if (!user?.id || !residentId) return null;
      const { data, error } = await supabase
        .from('caerhold_visitor_relationships')
        .select('*')
        .eq('user_id', user.id)
        .eq('resident_id', residentId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CaerholdVisitorRelationship | null;
    },
    enabled: !!user?.id && !!residentId,
  });
}

interface SendMessageParams {
  residentId: string;
  message: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ residentId, message, onDelta, onDone }: SendMessageParams) => {
      if (!user?.id) throw new Error('Must be logged in');

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-resident`;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ resident_id: residentId, message }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        if (resp.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
        if (resp.status === 402) throw new Error('Usage limit reached. Please try again later.');
        throw new Error(errBody || 'Chat failed');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch { /* ignore */ }
        }
      }

      onDone();
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caerhold-chat-messages', variables?.residentId] });
      queryClient.invalidateQueries({ queryKey: ['caerhold-relationship', variables?.residentId] });
    },
  });
}
