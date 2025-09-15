import { ConversationMessage } from './types.js';

export class ConversationManager {
  private conversationHistory: ConversationMessage[] = [];
  private readonly maxHistoryLength = 10;

  addMessage(role: 'user' | 'assistant', content: string) {
    this.conversationHistory.push({ role, content });
    this.trimHistory();
  }

  getConversationHistory(count = 5): ConversationMessage[] {
    return this.conversationHistory.slice(-count);
  }

  clear() {
    this.conversationHistory = [];
  }

  private trimHistory() {
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }
}
