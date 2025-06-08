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
import {FileParserService, Transaction} from '../../services/data';
import {DataPersistenceService} from '../../services/data-persistence.service';
import Chart from 'chart.js/auto';
import {FormsModule} from '@angular/forms';

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

    @ViewChild('mainChart') mainChartRef!: ElementRef<HTMLCanvasElement>;

    constructor(
        private fileParserService: FileParserService,
        private cdr: ChangeDetectorRef,
        private dataPersistence: DataPersistenceService
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['transactions'] && this.transactions) {
            this.currentPage = 1;
            this.updatePagination();
        }
    }

    ngOnInit(): void {
        // Carrega dados persistidos do localStorage ao iniciar
        const keys = this.dataPersistence.getAllKeys();
        let allPersistedTransactions: Transaction[] = [];
        keys.forEach(key => {
            const transactions = this.dataPersistence.getItem<Transaction[]>(key);
            if (transactions && Array.isArray(transactions)) {
                allPersistedTransactions = allPersistedTransactions.concat(transactions);
            }
        });
        if (allPersistedTransactions.length > 0) {
            this.fileParserService.updateTransactions(allPersistedTransactions);
        }
        this.transactionsSubscription = this.fileParserService.currentTransactions.subscribe(transactions => {
            this.transactions = transactions;
            if (transactions.length > 0) {
                this.calculateSummary();
            }
            this.cdr.detectChanges();
            if (this.transactions && this.transactions.length > 0) {
                this.updatePagination();
            }
        });
    }

    ngAfterViewInit(): void {
        // Verificamos se temos transações e criamos o gráfico após a view estar inicializada
        if (this.transactions.length > 0) {
            setTimeout(() => {
                this.createCategoryChart();
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
            .reduce((sum, t) => sum + t.value, 0);
        const expenses = this.transactions
            .filter(t => t.value < 0)
            .reduce((sum, t) => sum + t.value, 0);

        this.summary = {
            revenue: revenue,
            expenses: Math.abs(expenses),
            balance: revenue + expenses
        };
    }

    createCategoryChart(): void {
        this.chartTitle = 'Despesas por Categoria';
        this.isDetailView = false;

        const expenses = this.transactions.filter(t => t.value < 0);
        const spendingByCategory = expenses.reduce((acc, tx) => {
            const category = tx.category || 'Outros';
            acc[category] = (acc[category] || 0) + Math.abs(tx.value);
            return acc;
        }, {} as { [key: string]: number });

        const labels = Object.keys(spendingByCategory);
        const data = Object.values(spendingByCategory);

        this.drawChart('pie', {
            labels: labels,
            datasets: [{
                label: 'Despesas',
                data: data,
                backgroundColor: this.generateColors(labels.length),
                hoverOffset: 4
            }]
        }, (_, elements) => {
            if (elements && elements.length > 0) {
                const clickedCategory = labels[elements[0].index];
                this.createDetailsChart(clickedCategory);
            }
        });
    }

    createDetailsChart(category: string): void {
        this.chartTitle = `Detalhes de ${category}`;
        this.isDetailView = true;

        const transactionsInCategory = this.transactions.filter(tx => tx.category === category && tx.value < 0);
        const spendingByDescription = transactionsInCategory.reduce((acc, tx) => {
            acc[tx.description] = (acc[tx.description] || 0) + Math.abs(tx.value);
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
                return '/assets/icons/banks/c6-bank-logo.svg';
            case 'itau':
            case 'itaú':
                return '/assets/icons/banks/itau-logo-2023.svg';
            case 'caixa':
            case 'caixa econômica':
                return '/assets/icons/banks/caixa-logo-2023.svg';
            default:
                return '';
        }
    }
}
