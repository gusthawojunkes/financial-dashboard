import {
    Component,
    Input,
    ViewChild,
    ElementRef,
    AfterViewInit,
    AfterViewChecked, OnChanges, SimpleChanges
} from '@angular/core';
import Chart from 'chart.js/auto';
import {CommonModule} from '@angular/common';
import Helper from '../../helper/helper';

@Component({
    selector: 'app-budget-distribution-chart',
    imports: [CommonModule],
    templateUrl: './budget-distribution-chart.html',
    styleUrl: './budget-distribution-chart.scss'
})
export class BudgetDistributionChart implements AfterViewInit, AfterViewChecked, OnChanges {
    @Input() salary: number = 0;
    @Input() expenses: any[] = [];
    @Input() categories: any[] = [];

    @ViewChild('budgetChartCanvas', {static: false}) budgetChartCanvas!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;

    private chartShouldRender = false;
    private readonly expenseColors = Helper.categoryColors;
    private readonly remainingColor = '#2563eb';

    ngAfterViewInit() {
        this.chartShouldRender = true;
        this.renderChart();
    }

    ngAfterViewChecked() {
        if (this.chartShouldRender) {
            this.renderChart();
            this.chartShouldRender = false;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['salary'] || changes['expenses'] || changes['categories']) {
            this.chartShouldRender = true;
            this.renderChart();
        }
    }

    renderChart() {
        const hasData = (this.expenses.length > 0 || this.categories.length > 0);
        if (!this.budgetChartCanvas || !this.budgetChartCanvas.nativeElement || !(this.salary > 0 && hasData)) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }
        const canvas = this.budgetChartCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (this.chart) {
            this.chart.destroy();
        }
        const chartLabels: string[] = [];
        const chartData: number[] = [];
        const chartColors: string[] = [];
        this.expenses.forEach((e, i) => {
            chartLabels.push(e.name);
            chartData.push(e.value);
            chartColors.push(this.expenseColors[i % this.expenseColors.length]);
        });
        this.categories.forEach((cat, i) => {
            chartLabels.push(cat.name);
            const total = cat.expenses.reduce((sum: number, exp: any) => sum + exp.value, 0);
            chartData.push(total);
            chartColors.push(this.expenseColors[(this.expenses.length + i) % this.expenseColors.length]);
        });
        chartLabels.push('Saldo Restante');
        const used = chartData.reduce((a, b) => a + b, 0);
        chartData.push(Math.max(this.salary - used, 0));
        chartColors.push(this.remainingColor);
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                let label = context.label || '';
                                let value = context.parsed;
                                return `${label}: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                }
            }
        });
    }
}
