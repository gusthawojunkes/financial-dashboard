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
    selectedCategory: string | null = null;

    expenses: {
        name: string;
        value: number;
        percent: number;
        color: string;
        isPercent: boolean;
        selected?: boolean;
        category?: string;
    }[] = [];
    selectedExpenses: Set<number> = new Set();
    private readonly expenseColors = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15'];
    private readonly remainingColor = '#2563eb';
    categories: { name: string; expenses: any[] }[] = [];
    newCategoryName: string = '';
    showCategoryInput: boolean = false;


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
        let value;
        let percent;
        let isPercent = this.isPercentage;
        if (this.isPercentage) {
            percent = this.expenseValue;
            value = (this.salary * percent) / 100;
        } else {
            value = this.expenseValue;
            percent = this.salary > 0 ? (value / this.salary) * 100 : 0;
        }
        const color = this.expenseColors[this.expenses.length % this.expenseColors.length];
        this.expenses.push({
            name: this.expenseName,
            value,
            percent,
            color,
            isPercent,
            selected: false,
            category: this.selectedCategory || '',
        });
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
        this.chartShouldRender = true;
    }

    toggleExpenseSelection(index: number) {
        this.expenses[index].selected = !this.expenses[index].selected;
        if (this.expenses[index].selected) {
            this.selectedExpenses.add(index);
        } else {
            this.selectedExpenses.delete(index);
        }
    }

    createCategoryFromSelected() {
        if (this.selectedExpenses.size < 2 || !this.newCategoryName.trim()) return;
        const selected = Array.from(this.selectedExpenses).sort((a, b) => b - a);
        const groupedExpenses = selected.map(idx => this.expenses[idx]);
        this.categories.push({name: this.newCategoryName.trim(), expenses: groupedExpenses});
        // Remove grouped expenses from main list
        for (const idx of selected) {
            this.expenses.splice(idx, 1);
        }
        this.selectedExpenses.clear();
        this.newCategoryName = '';
        this.showCategoryInput = false;
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        localStorage.setItem('budget-categories', JSON.stringify(this.categories));
        this.chartShouldRender = true;
    }

    loadCategories() {
        const saved = localStorage.getItem('budget-categories');
        if (saved) {
            try {
                this.categories = JSON.parse(saved);
            } catch {
                this.categories = [];
            }
        }
    }

    ngOnInit() {
        this.loadCategories();
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
        this.categories = [];
        localStorage.removeItem('budget-categories');
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
        this.chartShouldRender = true;
    }

    recalculatePercentageExpenses() {
        this.expenses = this.expenses.map(exp => {
            if (exp.isPercent) {
                return {
                    ...exp,
                    value: (this.salary * exp.percent) / 100
                };
            } else {
                return {
                    ...exp,
                    percent: this.salary > 0 ? (exp.value / this.salary) * 100 : 0
                };
            }
        });
    }

    setSalary(value: number) {
        this.salary = value;
        this.recalculatePercentageExpenses();
        // Recalcula despesas das categorias agrupadas
        this.categories = this.categories.map(cat => ({
            ...cat,
            expenses: cat.expenses.map(exp => {
                if (exp.isPercent) {
                    return {
                        ...exp,
                        value: (this.salary * exp.percent) / 100
                    };
                } else {
                    return {
                        ...exp,
                        percent: this.salary > 0 ? (exp.value / this.salary) * 100 : 0
                    };
                }
            })
        }));
        localStorage.setItem('budget-salary', String(value));
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        localStorage.setItem('budget-categories', JSON.stringify(this.categories));
        this.chartShouldRender = true;
    }

    renderChart() {
        if (!this.budgetChartCanvas || !this.budgetChartCanvas.nativeElement || !(this.salary > 0 && ((this.expenses.length + this.categories.length) > 0 || this.totalExpenses > 0))) {
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
        // Monta lista de labels, valores e cores: despesas + categorias agrupadas
        const chartLabels: string[] = [];
        const chartData: number[] = [];
        const chartColors: string[] = [];
        // Despesas individuais
        this.expenses.forEach((e, i) => {
            chartLabels.push(e.name);
            chartData.push(e.value);
            chartColors.push(this.expenseColors[i % this.expenseColors.length]);
        });
        // Categorias agrupadas
        this.categories.forEach((cat, i) => {
            chartLabels.push(cat.name);
            const total = cat.expenses.reduce((sum, exp) => sum + exp.value, 0);
            chartData.push(total);
            // Cor para categoria agrupada: pega da paleta, mas deslocada para não colidir com despesas
            chartColors.push(this.expenseColors[(this.expenses.length + i) % this.expenseColors.length]);
        });
        // Saldo restante
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

    suggestBudget() {
        if (!this.salary || this.salary <= 0) {
            alert('Informe seu salário antes de sugerir um orçamento.');
            return;
        }
        const hasExpenses = this.expenses && this.expenses.length > 0;
        let confirmed = true;
        if (hasExpenses) {
            confirmed = confirm('Ao sugerir orçamento, todos os dados existentes serão excluídos e substituídos pela sugestão. Deseja continuar?');
        }
        if (!confirmed) return;
        const suggestions = [
            {name: 'Moradia', percent: 30, category: 'moradia'},
            {name: 'Alimentação', percent: 15, category: 'alimentacao'},
            {name: 'Saúde', percent: 10, category: 'saude'},
            {name: 'Educação', percent: 4, category: 'educacao'},
            {name: 'Transporte', percent: 8, category: 'transporte'},
            {name: 'Lazer', percent: 10, category: 'lazer'},
            {name: 'Extra', percent: 8, category: 'extra'},
            {name: 'Investimentos', percent: 15, category: 'investimentos'},
        ];
        this.expenses = suggestions.map((s, i) => ({
            name: s.name,
            value: (this.salary * s.percent) / 100,
            percent: s.percent,
            color: this.expenseColors[i % this.expenseColors.length],
            isPercent: true,
            selected: false,
            category: s.category
        }));
        localStorage.setItem('budget-expenses', JSON.stringify(this.expenses));
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
        this.chartShouldRender = true;
    }
}
