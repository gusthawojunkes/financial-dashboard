export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    isTyping?: boolean;
}

