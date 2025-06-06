import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FileParserService, Transaction } from '../../services/data';
import { AIService } from '../../services/ai';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  isTyping?: boolean;
}

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai.html',
  styleUrls: ['./ai.scss']
})
export class AIComponent implements OnInit, OnDestroy {
  private transactionsSubscription!: Subscription;
  private transactions: Transaction[] = [];

  isDataLoaded = false;

  // Estado da Análise Rápida
  isInsightsLoading = false;
  showModal = false;
  insights: any = null;

  // Estado do Chat
  chatHistory: ChatMessage[] = [];
  chatInput: string = '';
  isChatLoading = false;

  constructor(
    private fileParserService: FileParserService,
    private geminiService: AIService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.transactionsSubscription = this.fileParserService.currentTransactions.subscribe(transactions => {
      this.isDataLoaded = transactions.length > 0;
      this.transactions = transactions;
      this.initializeChat();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.transactionsSubscription) {
      this.transactionsSubscription.unsubscribe();
    }
  }

  initializeChat(): void {
      this.chatHistory = [];
      if (this.isDataLoaded) {
          this.chatHistory.push({ role: 'ai', content: 'Os seus dados foram carregados! Sou o seu assistente financeiro. Pergunte-me qualquer coisa.' });
      } else {
          this.chatHistory.push({ role: 'ai', content: 'Olá! Para começar, por favor, vá à secção "Importar" e carregue o seu extrato financeiro.' });
      }
  }

  // Lógica para a Análise Rápida
  async getFinancialInsights(): Promise<void> {
    this.isInsightsLoading = true;
    this.toggleModal(true);

    const revenue = this.transactions.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0);
    const expenses = this.transactions.filter(t => t.value < 0).reduce((s, t) => s + t.value, 0);
    const spendingByCategory = this.transactions.filter(t => t.value < 0).reduce((acc, tx) => {
        const category = tx.category || 'Outros';
        acc[category] = (acc[category] || 0) + Math.abs(tx.value);
        return acc;
    }, {} as Record<string, number>);

    const schema = { type: "OBJECT", properties: { summary: { "type": "STRING" }, tips: { type: "ARRAY", items: { type: "STRING" } }, observation: { "type": "STRING" } }, required: ["summary", "tips", "observation"] };
    const prompt = `Analise os dados financeiros. Receita: ${revenue.toFixed(2)}, Despesa: ${Math.abs(expenses).toFixed(2)}, Gastos por Categoria: ${JSON.stringify(spendingByCategory)}. Forneça em JSON (pt-BR): 1. "summary": resumo (2-3 frases), 2. "tips": 2-3 dicas para poupar, 3. "observation": 1 ponto de atenção.`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema } };

    try {
        const resultText = await this.geminiService.callAI(payload);
        this.insights = JSON.parse(resultText);
    } catch (error) {
        this.insights = { error: 'Ocorreu um erro ao gerar a análise. Tente novamente.' };
    } finally {
        this.isInsightsLoading = false;
    }
  }

  toggleModal(state?: boolean): void {
    this.showModal = state !== undefined ? state : !this.showModal;
    if (!this.showModal) {
      this.insights = null; // Limpa os dados ao fechar
    }
  }

  // Lógica para o Chat
  async handleChatMessage(): Promise<void> {
    const userMessage = this.chatInput.trim();
    if (!userMessage || this.isChatLoading) return;

    this.chatHistory.push({ role: 'user', content: userMessage });
    this.chatHistory.push({ role: 'ai', content: '', isTyping: true });
    this.chatInput = '';
    this.isChatLoading = true;

    const prompt = this.buildChatPrompt(userMessage);

    try {
        const aiResponse = await this.geminiService.callAI({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        this.updateLastAIMessage(aiResponse);
    } catch(error) {
        this.updateLastAIMessage("Desculpe, não consegui processar a sua pergunta. Tente novamente.");
    } finally {
        this.isChatLoading = false;
    }
  }

  private updateLastAIMessage(text: string): void {
      const lastMessage = this.chatHistory[this.chatHistory.length - 1];
      if (lastMessage && lastMessage.isTyping) {
          lastMessage.content = text;
          lastMessage.isTyping = false;
      }
  }

  private buildChatPrompt(userQuestion: string): string {
    const context = JSON.stringify(this.transactions.slice(0, 50).map(t => ({ v: t.value, d: t.description, c: t.category })));
    return `Você é um assistente financeiro. Responda à pergunta do utilizador com base nos seguintes dados de transações (em formato JSON). Seja conciso, amigável e use o formato de moeda do Brasil (R$).\nDados das Transações: ${context}\n\nPergunta do Utilizador: "${userQuestion}"`;
  }
}