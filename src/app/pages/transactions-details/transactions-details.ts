import {Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, ElementRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TransactionsTableComponent} from '../../components/transactions-table/transactions-table';
import Chart from 'chart.js/auto';

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
    year!: number;
    month!: number;
    transactions: Transaction[] = [];
    @ViewChild('dailyBalanceChart', {static: false}) chartRef!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;

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
        const ctx = this.chartRef.nativeElement.getContext('2d');
        if (!ctx) return;
        if (this.chart) {
            this.chart.destroy();
        }
        // Corrigir parsing da data para dd/MM/yyyy
        const getDay = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return day;
        };
        const days = Array.from(new Set(this.transactions.map(t => getDay(t.transactionTime)))).sort((a, b) => a - b);
        const received: number[] = [];
        const spent: number[] = [];
        days.forEach(day => {
            const dayTxs = this.transactions.filter(t => getDay(t.transactionTime) === day);
            received.push(dayTxs.filter(t => t.value > 0).reduce((sum, t) => sum + t.value, 0));
            spent.push(dayTxs.filter(t => t.value < 0).reduce((sum, t) => sum + Math.abs(t.value), 0));
        });
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days.map(d => d.toString()),
                datasets: [
                    {label: 'Recebido', data: received, backgroundColor: '#4caf50'},
                    {label: 'Gasto', data: spent, backgroundColor: '#f44336'}
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {display: true},
                    title: {display: true, text: 'Recebido vs Gasto por Dia'}
                }
            }
        });
    }
}
