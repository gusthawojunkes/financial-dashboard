import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    AfterViewInit,
    ElementRef,
    ViewChild,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Subscription} from 'rxjs';
import Chart from 'chart.js/auto';
import {FormsModule} from '@angular/forms';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, FormsModule],
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    private transactionsSubscription!: Subscription;
    transactions: Transaction[] = [];

    summary = {revenue: 0, expenses: 0, balance: 0};

    private chartInstance: Chart | null = null;
    chartTitle = 'Despesas por Categoria';
    isDetailView = false;
    public paginatedTransactions: Transaction[] = [];
    public currentPage: number = 1;
    public itemsPerPage: number = 8;
    public itemsPerPageOptions: number[] = [8, 16, 24];
    public totalPages: number = 0;

    selectedView: 'categoria' | 'banco' = 'categoria';

    hoveredIndex: number | null = null;

    @ViewChild('mainChart') mainChartRef!: ElementRef<HTMLCanvasElement>;

    private categoryColors: { [category: string]: string } = {};
    public hasExpenses: boolean = true;

    topExpenseCategories: { category: string, value: number }[] = [];

    constructor(
        private cdr: ChangeDetectorRef,
        private transactionService: TransactionService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['transactions'] && this.transactions) {
            this.currentPage = 1;
            this.updatePagination();
        }
    }

    async ngOnInit(): Promise<void> {
        setTimeout(() => {
            this.createChartByView();
        }, 500); // workaround for initial chart rendering issue
        await this.transactionService.loadTransactions();
        this.transactionsSubscription = this.transactionService.currentTransactions.subscribe(transactions => {
            this.transactions = transactions;
            if (transactions.length > 0) {
                this.calculateSummary();
                this.updateTopExpenseCategories();
                this.createChartByView();
            }
            this.cdr.detectChanges();
            if (this.transactions && this.transactions.length > 0) {
                this.updatePagination();
            }
        });
    }

    ngAfterViewInit(): void {
        if (this.transactions.length > 0) {
            setTimeout(() => {
                this.createChartByView();
            }, 0);
        }
    }

    ngOnDestroy(): void {
        if (this.transactionsSubscription) {
            this.transactionsSubscription.unsubscribe();
        }
        if (this.chartInstance) {
            this.chartInstance.destroy();
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

    onItemsPerPageChange(newItemsPerPage: string | number): void {
        this.itemsPerPage = Number(newItemsPerPage);
        this.currentPage = 1;
        this.updatePagination();
    }

    calculateSummary(): void {
        const revenue = this.transactions
            .filter(t => t.value > 0)
            .reduce((sum, t) => sum + (this.transactionService.convertToBRL(t.value, t.currency) || t.value), 0);
        const expenses = this.transactions
            .filter(t => t.value < 0)
            .reduce((sum, t) => sum + (this.transactionService.convertToBRL(t.value, t.currency) || t.value), 0);

        this.summary = {
            revenue: revenue,
            expenses: Math.abs(expenses),
            balance: revenue + expenses
        };
    }

    private updateTopExpenseCategories(): void {
        const expenses = this.transactions.filter(t => t.value < 0);
        const spendingByCategory: { [key: string]: number } = {};
        expenses.forEach(tx => {
            const category = tx.category || 'Outros';
            spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs((this.transactionService.convertToBRL(tx.value, tx.currency) || tx.value));
        });
        this.topExpenseCategories = Object.entries(spendingByCategory)
            .map(([category, value]) => ({category, value}))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }

    setView(view: 'categoria' | 'banco'): void {
        if (this.selectedView !== view) {
            this.selectedView = view;
            this.createChartByView();
        }
    }

    createChartByView(): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        if (this.selectedView === 'banco') {
            this.createBankChart();
            this.chartTitle = 'Despesas por Banco';
        } else {
            this.createCategoryChart();
            this.chartTitle = 'Despesas por Categoria';
        }
    }

    createCategoryChart(): void {
        this.chartTitle = 'Despesas por Categoria';
        this.isDetailView = false;

        const expenses = this.transactions.filter(t => t.value < 0);
        this.hasExpenses = expenses.length > 0;
        if (!this.hasExpenses) {
            if (this.chartInstance) this.chartInstance.destroy();
            return;
        }
        const spendingByCategory = expenses.reduce((acc, tx) => {
            const category = tx.category || 'Outros';
            acc[category] = (acc[category] || 0) + Math.abs((this.transactionService.convertToBRL(tx.value, tx.currency) || tx.value));
            return acc;
        }, {} as { [key: string]: number });

        const labels = Object.keys(spendingByCategory);
        const data = Object.values(spendingByCategory);
        const colors = this.generateColors(labels.length);
        // Store category-color mapping
        this.categoryColors = {};
        labels.forEach((cat, idx) => {
            this.categoryColors[cat] = colors[idx];
        });

        this.drawChart('pie', {
            labels: labels,
            datasets: [{
                label: 'Despesas',
                data: data,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        }, (_, elements) => {
            if (elements && elements.length > 0) {
                const clickedCategory = labels[elements[0].index];
                this.createDetailsChart(clickedCategory);
            }
        });
    }

    getCategoryColor(category: string | undefined): string | null {
        if (!category) return null;
        return this.categoryColors[category] || null;
    }

    createDetailsChart(category: string): void {
        this.chartTitle = `Detalhes de ${category}`;
        this.isDetailView = true;

        const transactionsInCategory = this.transactions.filter(tx => tx.category === category && tx.value < 0);
        const spendingByDescription = transactionsInCategory.reduce((acc, tx) => {
            acc[tx.description] = (acc[tx.description] || 0) + Math.abs((this.transactionService.convertToBRL(tx.value, tx.currency) || tx.value));
            return acc;
        }, {} as { [key: string]: number });

        const labels = Object.keys(spendingByDescription);
        const data = Object.values(spendingByDescription);

        this.drawChart('bar', {
            labels: labels,
            datasets: [{
                label: `Despesas em ${category}`,
                data: data,
                backgroundColor: '#3b82f6'
            }]
        });
    }

    createBankChart(): void {
        if (!this.mainChartRef) return;
        const ctx = this.mainChartRef.nativeElement.getContext('2d');
        if (!ctx) return;
        const bankTotals: { [bank: string]: number } = {};
        this.transactions.filter(t => t.value < 0).forEach(t => {
            const bank = t.institution || 'Outro';
            bankTotals[bank] = (bankTotals[bank] || 0) + Math.abs((this.transactionService.convertToBRL(t.value, t.currency) || t.value));
        });
        const labels = Object.keys(bankTotals).map(label => {
            if (label.toLowerCase() === 'c6_bank' || label.toLowerCase() === 'c6bank' || label.toLowerCase() === 'c6 bank') {
                return 'C6 Bank';
            }
            return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        });
        const data = Object.values(bankTotals)
        const bankColors: { [bank: string]: string } = {
            'nubank': '#8A05BE',
            'wise': '#9FE870'
        };
        const backgroundColor = labels.map(label => {
            const key = label.toLowerCase();
            return bankColors[key] || '#BDBDBD';
        });
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                }]
            },
            options: {
                plugins: {
                    legend: {position: 'bottom'},
                }
            }
        });
    }

    private drawChart(type: 'pie' | 'bar', data: any, onClick?: (event: any, elements: any[]) => void): void {
        if (!this.mainChartRef) {
            console.error('Canvas element not found');
            return;
        }

        const canvas = this.mainChartRef.nativeElement;
        if (!canvas) {
            console.error('Canvas element not available');
            return;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(canvas, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: onClick,
                indexAxis: type === 'bar' ? 'y' : 'x',
                plugins: {
                    legend: {
                        display: type === 'pie'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw as number;
                                return `${context.label}: ${value.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                })}`;
                            }
                        }
                    }
                }
            }
        });
    }

    private generateColors(numColors: number): string[] {
        const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#d946ef'];
        return Array.from({length: numColors}, (_, i) => colors[i % colors.length]);
    }

    getBankIcon(institution: string): string {
        switch (institution.toLowerCase()) {
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
        const code = map[currency.toUpperCase()] || 'br'; // Default to Brazil if not found
        return `/assets/icons/flags/${code}.svg`;
    }

    getConvertedTooltip(tx: Transaction): string | null {
        if (!tx.currency || tx.currency.toUpperCase() === 'BRL') return null;
        const converted = this.transactionService.convertToBRL(tx.value, tx.currency);
        if (!converted) return null;
        return `${converted.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
    }

    getCategoryIcon(category: string | undefined): string {
        if (!category) return '/assets/icons/tag.svg';
        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('alimentação')) {
            return '/assets/icons/shopping-cart.svg';
        } else if (lowerCategory.includes('pix')) {
            return '/assets/icons/pix.svg';
        }
        return '/assets/icons/tag.svg'; // Default icon
    }
}
