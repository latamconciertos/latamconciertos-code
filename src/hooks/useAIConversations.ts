/**
 * useAIConversations Hook
 * Manages AI conversation state and operations
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateConversationTitle } from '@/lib/ai/conversationUtils';
import type { Message, Conversation } from '@/types/aiAssistant';

interface UseAIConversationsProps {
    userId: string | null;
    userName: string;
}

interface UseAIConversationsReturn {
    // State
    conversations: Conversation[];
    conversationId: string | null;
    deleteDialogOpen: boolean;
    conversationToDelete: string | null;
    renamingConversation: string | null;
    renameValue: string;
    longPressTimer: NodeJS.Timeout | null;

    // Setters
    setConversationId: (id: string | null) => void;
    setDeleteDialogOpen: (open: boolean) => void;
    setConversationToDelete: (id: string | null) => void;
    setRenamingConversation: (id: string | null) => void;
    setRenameValue: (value: string) => void;
    setLongPressTimer: (timer: NodeJS.Timeout | null) => void;

    // Actions
    loadConversations: (uid: string) => Promise<void>;
    createNewConversation: () => void;
    loadConversation: (convId: string) => Promise<Message[]>;
    handleDeleteConversation: () => Promise<void>;
    handleRenameConversation: (convId: string) => Promise<void>;
    handleLongPressStart: (convId: string, title: string) => void;
    handleLongPressEnd: () => void;
    createConversationWithTitle: (uid: string, firstMessage: string) => Promise<string>;
}

export function useAIConversations({ userId, userName }: UseAIConversationsProps): UseAIConversationsReturn {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const [renamingConversation, setRenamingConversation] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const { toast } = useToast();

    // Load all conversations for a user
    const loadConversations = async (uid: string) => {
        const { data, error } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('user_id', uid)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error loading conversations:', error);
            return;
        }

        setConversations(data || []);
    };

    // Create a new empty conversation
    const createNewConversation = () => {
        if (!userId) return;

        // Just clear the state - conversation will be created automatically
        // with a smart title when the user sends their first message
        setConversationId(null);
    };

    // Create conversation with smart title from first message
    const createConversationWithTitle = async (uid: string, firstMessage: string): Promise<string> => {
        const { data: newConversation, error: createError } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: uid,
                title: generateConversationTitle(firstMessage),
            })
            .select()
            .single();

        if (createError) {
            throw new Error('No se pudo crear la conversación');
        }

        setConversationId(newConversation.id);
        loadConversations(uid);
        return newConversation.id;
    };

    // Load a specific conversation's messages
    const loadConversation = async (convId: string): Promise<Message[]> => {
        const { data: messagesData, error } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading conversation:', error);
            toast({
                title: "Error",
                description: "No se pudo cargar la conversación",
                variant: "destructive",
            });
            return [];
        }

        setConversationId(convId);

        // Map to Message type
        return messagesData.map(msg => ({
            role: msg.role as 'user' | 'bot',
            content: msg.content
        }));
    };

    // Delete a conversation
    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;

        const { error } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', conversationToDelete);

        if (error) {
            console.error('Error deleting conversation:', error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la conversación",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Conversación eliminada",
            description: "La conversación se eliminó correctamente",
        });

        // If deleted conversation is current, clear it
        if (conversationToDelete === conversationId) {
            setConversationId(null);
        }

        if (userId) {
            loadConversations(userId);
        }

        setDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    // Rename a conversation
    const handleRenameConversation = async (convId: string) => {
        if (!renameValue.trim()) {
            setRenamingConversation(null);
            return;
        }

        const { error } = await supabase
            .from('ai_conversations')
            .update({ title: renameValue.trim() })
            .eq('id', convId);

        if (error) {
            console.error('Error renaming conversation:', error);
            toast({
                title: "Error",
                description: "No se pudo renombrar la conversación",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Conversación renombrada",
            description: "El título se actualizó correctamente",
        });

        if (userId) {
            loadConversations(userId);
        }

        setRenamingConversation(null);
        setRenameValue('');
    };

    // Long press handlers for mobile
    const handleLongPressStart = (convId: string, title: string) => {
        const timer = setTimeout(() => {
            setRenamingConversation(convId);
            setRenameValue(title);
        }, 800);
        setLongPressTimer(timer);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // Load conversations when user changes
    useEffect(() => {
        if (userId) {
            loadConversations(userId);
        }
    }, [userId]);

    return {
        // State
        conversations,
        conversationId,
        deleteDialogOpen,
        conversationToDelete,
        renamingConversation,
        renameValue,
        longPressTimer,

        // Setters
        setConversationId,
        setDeleteDialogOpen,
        setConversationToDelete,
        setRenamingConversation,
        setRenameValue,
        setLongPressTimer,

        // Actions
        loadConversations,
        createNewConversation,
        loadConversation,
        handleDeleteConversation,
        handleRenameConversation,
        handleLongPressStart,
        handleLongPressEnd,
        createConversationWithTitle,
    };
}
