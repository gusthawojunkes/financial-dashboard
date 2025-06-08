import {Injectable} from '@angular/core';
import {Transaction} from '../models/transaction.model';
import {environment} from '../../environments/environment';
import {PROMPTS} from '../constants/prompts';

@Injectable({
    providedIn: 'root'
})
export class AIService {
    private apiKey = environment.geminiApiKey;

    constructor() {
        if (!this.apiKey) {
            console.error("API Key do Gemini não foi encontrada!");
        }
    }

    async callAI(payload: any): Promise<string> {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(`API Error: ${response.status} - ${err.error?.message || 'Unknown error'}`);
            }
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                return result.candidates[0].content.parts[0].text;
            }
            throw new Error("Resposta da API inválida.");
        } catch (error) {
            console.error("Erro na chamada Gemini:", error);
            throw error;
        }
    }

    async categorizeTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        const uniqueDescriptions = [...new Set(transactions.map(t => t.description))];
        const schema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {description: {"type": "STRING"}, category: {"type": "STRING"}},
                required: ["description", "category"]
            }
        };
        const allResults: { description: string; category: string }[] = [];
        for (let i = 0; i < uniqueDescriptions.length; i += 50) {
            const batch = uniqueDescriptions.slice(i, i + 50);
            const prompt = PROMPTS.CATEGORIZE_TRANSACTIONS(batch);
            const payload = {
                contents: [{role: "user", parts: [{text: prompt}]}],
                generationConfig: {responseMimeType: "application/json", responseSchema: schema}
            };
            const resultText = await this.callAI(payload);
            const batchResult = JSON.parse(resultText);
            allResults.push(...batchResult);
        }
        const categoryMap = allResults.reduce((map: any, item: any) => (map[item.description] = item.category, map), {});
        return transactions.map(t => ({...t, category: categoryMap[t.description] || 'Outros'}));
    }
}
