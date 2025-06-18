import {Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, ElementRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TransactionsTableComponent} from '../../components/transactions-table/transactions-table';
import Chart from 'chart.js/auto';
import DateHelper from '../../helper/date.helper';

@Component({
    selector: 'app-transactions-details',
    templateUrl: './transactions-details.html',
    imports: [
        CommonModule,
        FormsModule,
        TransactionsTableComponent
    ],
    styleUrls: ['./transactions-details.scss']
})
export class TransactionsDetailsComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild('dailyBalanceChart', {static: false}) chartRef!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;
    year!: number;
    month!: number;
    transactions: Transaction[] = [];
    chartType: 'line' | 'bar' = 'line';
    showAllDays: boolean = true;
    monthNamePerNumber = DateHelper.monthNamePerNumber;

    constructor(
        private route: ActivatedRoute,
        private transactionService: TransactionService
    ) {
    }

    ngOnInit() {
        this.year = +this.route.snapshot.paramMap.get('year')!;
        this.month = +this.route.snapshot.paramMap.get('month')!;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        if (
            this.year > currentYear ||
            (this.year === currentYear && this.month > currentMonth)
        ) {
            alert('Não pode ser pesquisada uma data no futuro.');
            window.location.href = `/`;
            return;
        }
        this.loadTransactions();
    }

    ngAfterViewInit() {
        this.renderChart();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['transactions']) {
            this.renderChart();
        }
    }

    loadTransactions() {
        this.transactionService.getTransactionsByMonth(this.year, this.month)
            .subscribe((data: Transaction[]) => {
                this.transactions = data;
                this.renderChart();
            });
    }

    renderChart() {
        if (!this.chartRef) return;
        if (!this.transactions || this.transactions.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }
        const ctx = this.chartRef.nativeElement.getContext('2d');
        if (!ctx) return;
        if (this.chart) {
            this.chart.destroy();
        }
        const getDay = (dateStr: string) => {
            const [day, month, year] = DateHelper.splitBrazilianDate(dateStr);
            return day;
        };
        const daysInMonth = new Date(this.year, this.month, 0).getDate();
        let days: number[];
        if (this.showAllDays) {
            days = Array.from({length: daysInMonth}, (_, i) => i + 1);
        } else {
            days = Array.from(new Set(this.transactions.map(t => getDay(t.transactionTime)))).sort((a, b) => a - b);
        }
        const received: number[] = [];
        const spent: number[] = [];
        days.forEach(day => {
            const dayTxs = this.transactions.filter(t => getDay(t.transactionTime) === day);
            received.push(dayTxs.filter(t => t.value > 0).reduce((sum, t) => sum + t.value, 0));
            spent.push(dayTxs.filter(t => t.value < 0).reduce((sum, t) => sum + Math.abs(t.value), 0));
        });
        this.chart = new Chart(ctx, {
            type: this.chartType,
            data: {
                labels: days.map(d => d.toString()),
                datasets: [
                    {
                        label: 'Recebido (R$)',
                        data: received,
                        borderColor: '#4caf50',
                        backgroundColor: this.chartType === 'line' ? 'rgba(76, 175, 80, 0.1)' : '#4caf50',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Gasto',
                        data: spent,
                        borderColor: '#f44336',
                        backgroundColor: this.chartType === 'line' ? 'rgba(244, 67, 54, 0.1)' : '#f44336',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {display: true},
                    title: {display: true, text: 'Recebido vs Gasto por Dia'}
                },
                interaction: {mode: 'index', intersect: false},
                scales: {
                    x: {title: {display: true, text: 'Dia do Mês'}},
                    y: {title: {display: true, text: 'Valor (R$)'}}
                }
            }
        });
    }

    setChartType(type: 'line' | 'bar') {
        this.chartType = type;
        this.renderChart();
    }

    goToNextMonth() {
        if (this.month === 12) {
            this.month = 1;
            this.year++;
        } else {
            this.month++;
        }
        window.location.href = `/transactions/${this.year}/${this.month}`;
    }

    goToPreviousMonth() {
        if (this.month === 1) {
            this.month = 12;
            this.year--;
        } else {
            this.month--;
        }
        window.location.href = `/transactions/${this.year}/${this.month}`;
    }

    isNextMonthInFuture(): boolean {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        let nextMonth = this.month + 1;
        let nextYear = this.year;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        return nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);
    }

    isPreviousMonthInPast(): boolean {
        return this.year <= 1970 && this.month === 1;
    }
}
