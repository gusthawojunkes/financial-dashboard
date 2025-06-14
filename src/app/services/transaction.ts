import {Injectable} from '@angular/core';
import {Transaction} from '../models/transaction.model';
import {LocalStorageService} from './local-storage';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private apiUrl = `${environment.transactionsServiceBaseUrl}/transactions`;
    private transactionsSource = new BehaviorSubject<Transaction[]>([]);
    currentTransactions = this.transactionsSource.asObservable();

    constructor(
        private dataPersistence: LocalStorageService,
        private http: HttpClient
    ) {
    }

    updateTransactions(transactions: Transaction[]) {
        transactions.map((transaction) => {
            transaction.transactionTime = transaction.transactionTime.split(' ')[0]
        })
        this.transactionsSource.next(transactions);
    }

    getAll(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}`);
    }

    getAllFromLocal(): Observable<Transaction[]> {
        const keys = this.dataPersistence.getAllKeys();
        let allPersistedTransactions: Transaction[] = [];
        keys.forEach(key => {
            const transactions = this.dataPersistence.getItem<Transaction[]>(key);
            if (transactions && Array.isArray(transactions)) {
                allPersistedTransactions = allPersistedTransactions.concat(transactions);
            }
        });

        return new Observable<Transaction[]>(observer => {
            observer.next(allPersistedTransactions);
            observer.complete();
        });
    }

    async loadTransactions() {
        this.getAll().subscribe(transactions => {
            if (transactions.length > 0) {
                this.updateTransactions(transactions);
            }
        });
    }

    private currencyRates: { [key: string]: number } = {
        'USD': 5.2,
        'EUR': 5.6,
        'CAD': 4,
        'BRL': 1
    };

    convertToBRL(value: number, currency: string): number | null {
        if (currency?.toUpperCase() === 'BRL') return null;
        const rate = this.currencyRates[currency?.toUpperCase()];
        if (!rate) return null;
        return value * rate;
    }

    getTransactionsByMonth(year: number, month: number): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/${year}/${month}`);
    }

}
