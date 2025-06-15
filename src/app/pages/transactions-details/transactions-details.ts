import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-transactions-details',
    templateUrl: './transactions-details.html',
    imports: [
        CommonModule,
        CurrencyPipe,
        FormsModule
    ],
    styleUrls: ['./transactions-details.scss']
})
export class TransactionsDetailsComponent implements OnInit {
    year!: number;
    month!: number;
    transactions: Transaction[] = [];
    paginatedTransactions: Transaction[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 16;
    itemsPerPageOptions: number[] = [8, 16, 24];
    totalPages: number = 0;
    hoveredIndex: number | null = null;
    private categoryColors: { [category: string]: string } = {};

    constructor(
        private route: ActivatedRoute,
        private transactionService: TransactionService
    ) {
    }

    ngOnInit() {
        this.year = +this.route.snapshot.paramMap.get('year')!;
        this.month = +this.route.snapshot.paramMap.get('month')!;
        this.loadTransactions();
    }

    loadTransactions() {
        this.transactionService.getTransactionsByMonth(this.year, this.month)
            .subscribe((data: Transaction[]) => {
                this.transactions = data;
                this.currentPage = 1;
                this.updatePagination();
                this.updateCategoryColors();
            });
    }

    updatePagination(): void {
        if (!this.transactions || this.transactions.length === 0) {
            this.paginatedTransactions = [];
            this.totalPages = 0;
            this.currentPage = 1;
            return;
        }
        this.totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        } else if (this.currentPage < 1 && this.totalPages > 0) {
            this.currentPage = 1;
        } else if (this.totalPages === 0) {
            this.currentPage = 1;
        }
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedTransactions = this.transactions.slice(startIndex, endIndex);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    onItemsPerPageChange(event: any): void {
        const value = typeof event === 'object' && event.target ? event.target.value : event;
        this.itemsPerPage = Number(value);
        this.currentPage = 1;
        this.updatePagination();
    }

    getBankIcon(institution: string): string {
        switch (institution?.toLowerCase()) {
            case 'nubank':
                return '/assets/icons/banks/nubank-logo-2021.svg';
            case 'c6 bank':
            case 'c6':
            case 'c6bank':
            case 'c6_bank':
                return '/assets/icons/banks/c6-bank-logo-mini.jpeg';
            case 'itau':
            case 'itaú':
                return '/assets/icons/banks/itau-logo-2023.svg';
            case 'caixa':
            case 'caixa econômica':
                return '/assets/icons/banks/caixa-logo-2023.svg';
            case 'wise':
                return '/assets/icons/banks/wise-logo-mini.png';
            default:
                return '';
        }
    }

    getCurrencyFlag(currency: string): string {
        const map: { [key: string]: string } = {
            'BRL': 'br',
            'CAD': 'ca',
            'USD': 'us',
            'EUR': 'eu',
        };
        const code = map[currency?.toUpperCase()] || 'br';
        return `/assets/icons/flags/${code}.svg`;
    }

    getConvertedTooltip(tx: Transaction): string | null {
        if (!tx.currency || tx.currency.toUpperCase() === 'BRL') return null;
        const converted = this.transactionService.convertToBRL(tx.value, tx.currency);
        if (!converted) return null;
        return `${converted.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
    }

    getCategoryColor(category: string | undefined): string | null {
        if (!category) return null;
        return this.categoryColors[category] || null;
    }

    private updateCategoryColors(): void {
        // Gera cores para as categorias presentes nas transações
        const categories = Array.from(new Set(this.transactions.map(tx => tx.category || 'Outros')));
        const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#d946ef'];
        this.categoryColors = {};
        categories.forEach((cat, idx) => {
            this.categoryColors[cat] = colors[idx % colors.length];
        });
    }
}
