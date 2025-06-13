import {Component, ChangeDetectorRef, AfterViewInit, AfterViewChecked, ElementRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import Chart from 'chart.js/auto';

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 90%, 55%)`;
}


@Component({
    selector: 'app-budget',
    imports: [CommonModule, FormsModule],
    templateUrl: './budget.html',
    styleUrl: './budget.scss'
})
export class BudgetComponent implements AfterViewInit, AfterViewChecked {
    salary: number = 0;
    expenseName: string = '';
    expenseValue: number = 0;
    isPercentage: boolean = false;

    expenses: { name: string; value: number; color: string }[] = [];

    @ViewChild('budgetChartCanvas', {static: false}) budgetChartCanvas!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;

    private chartShouldRender = false;

    constructor(private cdr: ChangeDetectorRef) {
        const savedSalary = localStorage.getItem('budget-salary');
        if (savedSalary !== null) {
            this.salary = parseFloat(savedSalary);
        }
        const savedExpenses = localStorage.getItem('budget-expenses');
        if (savedExpenses) {
            try {
                this.expenses = JSON.parse(savedExpenses);
            } catch (e) {
                this.expenses = [];
            }
        }
    }

    get totalExpenses(): number {
        return this.expenses.reduce((sum, exp) => sum + exp.value, 0);
    }

    get remaining(): number {
        return this.salary - this.totalExpenses;
    }

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

    addExpense() {
        if (!this.expenseName || this.expenseValue <= 0) return;
        let value = this.expenseValue;
        if (this.isPercentage) {
            value = (this.salary * this.expenseValue) / 100;
        }
        this.expenses.push({
            name: this.expenseName + (this.isPercentage ? ` (${this.expenseValue}%)` : ''),
            value,
            color: randomColor()
        });
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        this.expenseName = '';
        this.expenseValue = 0;
        this.chartShouldRender = true;
    }

    removeExpense(index: number) {
        this.expenses.splice(index, 1);
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        this.chartShouldRender = true;
    }

    resetData() {
        this.salary = 0;
        localStorage.removeItem('budget-salary');
        this.expenses = [];
        localStorage.removeItem('budget-expenses');
        this.expenseName = '';
        this.expenseValue = 0;
        this.chartShouldRender = true;
    }

    setSalary(value: number) {
        this.salary = value;
        localStorage.setItem('budget-salary', String(value));
        this.chartShouldRender = true;
    }

    renderChart() {
        if (!this.budgetChartCanvas || !this.budgetChartCanvas.nativeElement || !(this.salary > 0 && (this.expenses.length > 0 || this.totalExpenses > 0))) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }
        const canvas = this.budgetChartCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const expenseColors = this.expenses.map(e => e.color);
        const chartLabels = this.expenses.map(e => e.name).concat('Saldo Restante');
        const chartData = this.expenses.map(e => e.value).concat(Math.max(this.remaining, 0));
        const chartColors = expenseColors.concat('#2563eb');
        if (this.chart) {
            // Atualiza os dados do gráfico existente
            this.chart.data.labels = chartLabels;
            this.chart.data.datasets[0].data = chartData;
            this.chart.data.datasets[0].backgroundColor = chartColors;
            this.chart.update();
        } else {
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
                        }
                    }
                }
            });
        }
    }
}
