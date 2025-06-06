import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Define uma interface para as transações para uma tipagem mais forte
export interface Transaction {
  value: number;
  description: string;
  transactionTime: string;
  category?: string;
  // Adicione outras propriedades se necessário
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsImportService {
  private transactionsSource = new BehaviorSubject<Transaction[]>([]);
  currentTransactions = this.transactionsSource.asObservable();

  constructor() { }

  // Atualiza as transações para que outros componentes possam subscrever a estas mudanças
  updateTransactions(transactions: Transaction[]) {
    this.transactionsSource.next(transactions);
  }
}