import {Component, ChangeDetectorRef, AfterViewInit, AfterViewChecked, ElementRef, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-budget',
    imports: [CommonModule, FormsModule, NgOptimizedImage],
    templateUrl: './budget.html',
    styleUrl: './budget.scss'
})
export class BudgetComponent implements AfterViewInit, AfterViewChecked {
    salary: number = 0;
    expenseName: string = '';
    expenseValue: number = 0;
    isPercentage: boolean = false;

    expenses: { name: string; value: number; color: string }[] = [];
    private readonly expenseColors = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15'];
    private readonly remainingColor = '#2563eb';


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
        const color = this.expenseColors[this.expenses.length % this.expenseColors.length];
        this.expenses.push({
            name: this.expenseName + (this.isPercentage ? ` (${this.expenseValue}%)` : ''),
            value,
            color
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

    recalculatePercentageExpenses() {
        this.expenses = this.expenses.map(exp => {
            const percentMatch = exp.name.match(/\((\d+(?:\.\d+)?)%\)$/);
            if (percentMatch) {
                const percent = parseFloat(percentMatch[1]);
                return {
                    ...exp,
                    value: (this.salary * percent) / 100
                };
            }
            return exp;
        });
    }

    setSalary(value: number) {
        this.salary = value;
        this.recalculatePercentageExpenses();
        localStorage.setItem('budget-salary', String(value));
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
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
        if (this.chart) {
            this.chart.destroy();
        }
        const expenseColors = this.expenses.map((_, i) => this.expenseColors[i % this.expenseColors.length]);
        const chartLabels = this.expenses.map(e => e.name).concat('Saldo Restante');
        const chartData = this.expenses.map(e => e.value).concat(Math.max(this.remaining, 0));
        const chartColors = expenseColors.concat(this.remainingColor);
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
                            label: function (context) {
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
