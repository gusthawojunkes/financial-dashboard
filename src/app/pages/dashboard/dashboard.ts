import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Subscription} from 'rxjs';
import Chart from 'chart.js/auto';
import {FormsModule} from '@angular/forms';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';
import {TransactionsTableComponent} from '../../components/transactions-table/transactions-table';
import {Router} from '@angular/router';
import DateHelper from '../../helper/date.helper';
import BankHelper from '../../helper/bank.helper';
import {RevenueSummaryComponent} from '../../components/revenue-summary/revenue-summary';
import CategoryHelper from '../../helper/category.helper';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, FormsModule, TransactionsTableComponent, RevenueSummaryComponent],
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('mainChart') mainChartRef!: ElementRef<HTMLCanvasElement>;
    private transactionsSubscription!: Subscription;
    private chartInstance: Chart | null = null;
    private categoryColors: { [category: string]: string } = {};
    public hasExpenses: boolean = true;
    public availableYears: number[] = [];
    public availableMonthsByYear: { [year: number]: number[] } = {};
    public selectedYear: number | null = null;
    public selectedMonth: number | null = null;

    transactions: Transaction[] = [];
    chartTitle = 'Despesas por Categoria';
    isDetailView = false;
    selectedView: 'categoria' | 'banco' = 'categoria';
    topExpenseCategories: { category: string, value: number }[] = [];
    public readonly monthNamePerNumber = DateHelper.monthNamePerNumber

    constructor(
        private cdr: ChangeDetectorRef,
        private transactionService: TransactionService,
        private router: Router,
    ) {
    }

    private updateAvailableYearsAndMonths(): void {
        const yearMonthSet: { [year: number]: Set<number> } = {};
        this.transactions.forEach(tx => {
            if (tx.transactionTime) {

                const [day, month, year] = DateHelper.splitBrazilianDate(tx.transactionTime);
                if (!isNaN(year) && !isNaN(month)) {
                    if (!yearMonthSet[year]) yearMonthSet[year] = new Set();
                    yearMonthSet[year].add(month);
                }
            }
        });
        this.availableYears = Object.keys(yearMonthSet).map(Number).sort((a, b) => a - b);
        this.availableMonthsByYear = {};
        for (const year of this.availableYears) {
            this.availableMonthsByYear[year] = Array.from(yearMonthSet[year]).sort((a, b) => a - b);
        }
    }

    selectYear(year: number): void {
        this.selectedYear = this.selectedYear === year ? null : year;
        this.selectedMonth = null;
    }

    selectMonth(year: number, month: number): void {
        this.selectedYear = year;
        this.selectedMonth = month;
        this.router.navigate(['/transactions', year, month]);
    }

    async ngOnInit(): Promise<void> {
        setTimeout(() => {
            this.createChartByView();
        }, 500);
        await this.transactionService.loadTransactions();
        this.transactionsSubscription = this.transactionService.currentTransactions.subscribe(transactions => {
            this.transactions = transactions;
            if (transactions.length > 0) {
                this.updateTopExpenseCategories();
                this.createChartByView();
                this.updateAvailableYearsAndMonths();
            }
            this.cdr.detectChanges();
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
        const colors: string[] = [];
        this.categoryColors = {};
        labels.forEach((cat, idx) => {
            this.categoryColors[cat] = CategoryHelper.getCategoryColor(cat);
            colors[idx] = this.categoryColors[cat];
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
                const clickedCategory = labels[elements[0].index]
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

        const backgroundColor = labels.map(label => {
            const key = label.toLowerCase();
            return BankHelper.getBankMainColor(key) || '#BDBDBD';
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

    showRevenueByYearChart(): void {
        this.chartTitle = 'Variação das Receitas por Ano';
        this.isDetailView = false;
        const revenues = this.transactions.filter(t => t.value > 0 && t.transactionTime);
        if (!revenues.length) {
            if (this.chartInstance) this.chartInstance.destroy();
            return;
        }
        const revenueByYear = revenues.reduce((acc, tx) => {
            const [date, month, year] = DateHelper.splitBrazilianDate(tx.transactionTime);
            const value = this.transactionService.convertToBRL(tx.value, tx.currency) || tx.value;
            acc[year] = (acc[year] || 0) + value;
            return acc;
        }, {} as { [key: string]: number });
        const years = Object.keys(revenueByYear).filter(y => !isNaN(Number(y)));
        const data = years.map(year => revenueByYear[year]).filter(v => !isNaN(v));
        if (!years.length || !data.length) {
            if (this.chartInstance) this.chartInstance.destroy();
            return;
        }
        this.drawChart('line', {
            labels: years,
            datasets: [{
                label: 'Receitas',
                data: data,
                backgroundColor: '#22c55e',
                borderColor: '#22c55e',
                fill: false,
                tension: 0.3
            }]
        });
    }

    private drawChart(type: 'pie' | 'bar' | 'line', data: any, onClick?: (event: any, elements: any[]) => void): void {
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

        const options: any = {
            responsive: true,
            maintainAspectRatio: false,
            onClick: onClick,
            plugins: {
                legend: {
                    display: type === 'pie' || type === 'line',
                    position: type == 'pie' ? 'right' : 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const value = context.raw as number;
                            return `${context.label}: ${value.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            })}`;
                        }
                    }
                }
            }
        };
        if (type === 'bar') {
            options.indexAxis = 'y';
        }
        this.chartInstance = new Chart(canvas, {
            type: type,
            data: data,
            options: options
        });
    }

    getCategoryIcon(category: string | undefined): string {
        return CategoryHelper.getCategoryIcon(category);
    }
}
