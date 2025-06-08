// filepath: src/app/constants/prompts.ts

export const PROMPTS = {
    ANALYZE_FINANCES: ({revenue, expenses, spendingByCategory}: {
        revenue: number,
        expenses: number,
        spendingByCategory: Record<string, number>
    }) =>
        `Analise os dados financeiros. Receita: ${revenue.toFixed(2)}, Despesa: ${Math.abs(expenses).toFixed(2)}, Gastos por Categoria: ${JSON.stringify(spendingByCategory)}. Forneça em JSON (pt-BR): 1. "summary": resumo (2-3 frases), 2. "tips": 2-3 dicas para poupar, 3. "observation": 1 ponto de atenção.`,
    CHAT: ({transactions, userQuestion}: {
        transactions: { value: number, description: string, category: string }[],
        userQuestion: string
    }) => {
        const context = JSON.stringify(transactions.slice(0, 50).map(t => ({
            v: t.value,
            d: t.description,
            c: t.category
        })));
        return `Você é um assistente financeiro. Responda à pergunta do utilizador com base nos seguintes dados de transações (em formato JSON). Seja conciso, amigável e use o formato de moeda do Brasil (R$).\nDados das Transações: ${context}\n\nPergunta do Utilizador: \"${userQuestion}\"`;
    },
    CATEGORIZE_TRANSACTIONS: (descriptions: string[]) =>
        `Categorize a lista de descrições de transações. Use apenas estas categorias: 'Alimentação', 'Transporte', 'Supermercado', 'Assinaturas', 'Saúde', 'Taxas e Impostos', 'Transferências', 'PIX', 'Salário', 'Moradia', 'Lazer', 'Compras', 'Educação', 'Outros'. "Pag.*Netflix" deve ser "Assinaturas". "Salario Empresa ABC" deve ser "Salário". Descrições: ${JSON.stringify(descriptions)}`
};
