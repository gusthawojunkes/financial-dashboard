import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Transaction} from '../../models/transaction.model';
import {TransactionService} from '../../services/transaction';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import BankHelper from '../../helper/bank.helper';
import CategoryHelper from '../../helper/category.helper';

@Component({
    selector: 'app-transactions-table',
    imports: [
        CommonModule,
        CurrencyPipe,
        FormsModule
    ],
    templateUrl: './transactions-table.html',
    styleUrl: './transactions-table.scss'
})
export class TransactionsTableComponent implements OnInit, OnChanges {

    @Input() transactions: Transaction[] = [];
    paginatedTransactions: Transaction[] = [];
    currentPage: number = 1;
    itemsPerPage: number = 8;
    itemsPerPageOptions: number[] = [8, 16, 24];
    totalPages: number = 0;
    hoveredIndex: number | null = null;
    private categoryColors: { [category: string]: string } = {};

    constructor(
        private transactionService: TransactionService
    ) {
    }

    ngOnInit() {
        this.updatePagination();
        this.updateCategoryColors();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['transactions']) {
            this.updatePagination();
            this.updateCategoryColors();
        }
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
        return BankHelper.getBankIcon(institution);
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
        return CategoryHelper.getCategoryColor(category);
    }

    private updateCategoryColors(): void {
        const categories = Array.from(new Set(this.transactions.map(tx => tx.category || 'Outros')));
        const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#d946ef'];
        this.categoryColors = {};
        categories.forEach((cat, idx) => {
            this.categoryColors[cat] = colors[idx % colors.length];
        });
    }

}
