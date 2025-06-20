import {
    Component,
    ChangeDetectorRef,
    AfterViewInit,
    AfterViewChecked,
    ElementRef,
    ViewChild,
    OnInit
} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import Chart from 'chart.js/auto';
import {Expense} from '../../models/expense.model';
import {Category} from '../../models/categorie.model';
import {Budget} from '../../models/budget.model';
import {BudgetService} from '../../services/budget';
import {LocalStorageService} from '../../services/local-storage';
import {Router} from '@angular/router';

@Component({
    selector: 'app-budget',
    imports: [CommonModule, FormsModule, NgOptimizedImage],
    templateUrl: './budget.html',
    styleUrl: './budget.scss'
})
export class BudgetComponent implements AfterViewInit, AfterViewChecked, OnInit {
    salary: number = 0;
    expenseName: string = '';
    expenseValue: number = 0;
    isPercentage: boolean = false;
    selectedCategory: string | null = null;

    expenses: Expense[] = [];
    categories: Category[] = [];
    selectedExpenses: Set<number> = new Set();
    private readonly expenseColors = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15'];
    private readonly remainingColor = '#2563eb';
    newCategoryName: string = '';
    showCategoryInput: boolean = false;
    savedBudgets: any[] = [];
    showBudgetsModal = false;


    @ViewChild('budgetChartCanvas', {static: false}) budgetChartCanvas!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;

    private chartShouldRender = false;

    constructor(private cdr: ChangeDetectorRef, private budgetService: BudgetService, private localStorageService: LocalStorageService, private router: Router) {
        this.salary = this.localStorageService.getItem<number>('budget-salary', 0);
        this.expenses = this.localStorageService.getItem<Expense[]>('budget-expenses', []);
    }

    get totalExpenses(): number {
        const expensesSum = this.expenses.reduce((sum, exp) => sum + exp.value, 0);
        const categoriesSum = this.categories.reduce((catSum, cat) => catSum + cat.expenses.reduce((sum, exp) => sum + exp.value, 0), 0);
        return expensesSum + categoriesSum;
    }

    get remaining(): number {
        return this.salary - this.totalExpenses;
    }

    get percentUsed(): number {
        if (!this.salary || this.salary === 0) return 0;
        return (this.totalExpenses / this.salary) * 100;
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
        const color = this.expenseColors[(this.expenses.length + this.categories.reduce((acc, c) => acc + c.expenses.length, 0)) % this.expenseColors.length];
        const newExpense = {
            name: this.expenseName,
            value,
            percent,
            color,
            isPercent,
            selected: false,
            category: this.selectedCategory || '',
        };
        if (this.selectedCategory) {
            const catIdx = this.categories.findIndex(c => c.name === this.selectedCategory);
            if (catIdx !== -1) {
                this.categories[catIdx].expenses.push(newExpense);
                if (typeof this.categories[catIdx].expanded === 'undefined') {
                    this.categories[catIdx].expanded = false;
                }
                this.localStorageService.setItem('budget-categories', this.categories);
                this.chartShouldRender = true;
            } else {
                this.expenses.push(newExpense);
                this.localStorageService.setItem('budget-expenses', this.expenses);
                this.chartShouldRender = true;
            }
        } else {
            this.expenses.push(newExpense);
            this.localStorageService.setItem('budget-expenses', this.expenses);
            this.chartShouldRender = true;
        }
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
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
        if (this.selectedExpenses.size < 1 || !this.newCategoryName.trim()) return;
        const selected = Array.from(this.selectedExpenses).sort((a, b) => b - a);
        const groupedExpenses = selected.map(idx => this.expenses[idx]);
        this.categories.push({name: this.newCategoryName.trim(), expenses: groupedExpenses, expanded: true});
        // Remove grouped expenses from main list
        for (const idx of selected) {
            this.expenses.splice(idx, 1);
        }
        this.selectedExpenses.clear();
        this.newCategoryName = '';
        this.showCategoryInput = false;
        this.localStorageService.setItem('budget-expenses', this.expenses);
        this.localStorageService.setItem('budget-categories', this.categories);
        this.chartShouldRender = true;
    }

    loadCategories() {
        const saved = this.localStorageService.getItem<any[]>('budget-categories');
        if (saved) {
            try {
                this.categories = saved.map((cat: any, idx: number) => ({
                    ...cat,
                    expanded: idx < 3
                }));
            } catch {
                this.categories = [];
            }
        }
    }

    ngOnInit() {
        this.loadCategories();
        this.loadSavedBudgets();
    }

    loadSavedBudgets() {
        this.savedBudgets = this.budgetService.getSavedBudgets();
    }

    detailBudget(id: string) {
        const budget = this.savedBudgets.find(b => b.id === id);
        if (budget) {
            this.router.navigate(['/budget/details', budget.id]);
        }
    }

    deleteBudget(id: string) {
        const budgets = this.budgetService.getSavedBudgets().filter(b => b.id !== id);
        this.budgetService.setSavedBudgets(budgets);
        this.loadSavedBudgets();
    }

    removeExpense(index: number) {
        this.expenses.splice(index, 1);
        this.localStorageService.setItem('budget-expenses', this.expenses);
        this.chartShouldRender = true;
    }

    resetData() {
        this.salary = 0;
        this.localStorageService.removeItem('budget-salary');
        this.expenses = [];
        this.localStorageService.removeItem('budget-expenses');
        this.categories = [];
        this.localStorageService.removeItem('budget-categories');
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
        this.chartShouldRender = true;
    }

    confirmResetData() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação irá excluir todas as despesas, categorias e o salário.')) {
            this.resetData();
        }
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
        this.localStorageService.setItem('budget-salary', value);
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
        this.localStorageService.setItem('budget-expenses', this.expenses);
        this.localStorageService.setItem('budget-categories', this.categories);
        this.chartShouldRender = true;
    }

    renderChart() {
        // Corrige condição para exibir o gráfico: deve considerar despesas OU categorias
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
            const total = cat.expenses.reduce((sum, exp) => sum + exp.value, 0);
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
        const hasCategories = this.categories && this.categories.length > 0;
        let confirmed = true;
        if (hasExpenses || hasCategories) {
            confirmed = confirm('Ao sugerir orçamento, todos os dados existentes (despesas e categorias) serão excluídos e substituídos pela sugestão. Deseja continuar?');
        }
        if (!confirmed) return;
        if (hasCategories) {
            this.categories = [];
            this.localStorageService.removeItem('budget-categories');
        }

        const suggestions = this.budgetService.getSuggestions();
        this.expenses = suggestions.map((s, i) => ({
            name: s.name,
            value: (this.salary * s.percent) / 100,
            percent: s.percent,
            color: this.expenseColors[i % this.expenseColors.length],
            isPercent: true,
            selected: false,
            category: s.category
        }));
        this.localStorageService.setItem('budget-expenses', this.expenses);
        this.expenseName = '';
        this.expenseValue = 0;
        this.selectedCategory = '';
        this.chartShouldRender = true;
    }

    removeCategory(index: number) {
        const removed = this.categories.splice(index, 1)[0];
        if (removed && removed.expenses) {
            removed.expenses.forEach(exp => exp.selected = false);
            this.expenses = this.expenses.concat(removed.expenses);
        }
        this.localStorageService.setItem('budget-expenses', this.expenses);
        this.localStorageService.setItem('budget-categories', this.categories);
        this.chartShouldRender = true;
    }

    getCategoryTotal(cat: { expenses: any[] }): number {
        return cat.expenses.reduce((sum, exp) => sum + exp.value, 0);
    }

    getCategoryPercent(cat: { expenses: any[] }): number {
        const total = this.getCategoryTotal(cat);
        return this.salary > 0 ? (total / this.salary) * 100 : 0;
    }

    toggleCategoryExpanded(index: number) {
        this.categories[index].expanded = !this.categories[index].expanded;
        this.cdr.detectChanges();
    }

    saveCurrentBudget() {
        const name = prompt('Digite um nome para este budget:');
        if (!name) return;
        const savedBudgets: Budget[] = this.getSavedBudgets();
        if (savedBudgets.some(b => b.name === name)) {
            alert('Já existe um budget salvo com esse nome. Escolha outro nome.');
            return;
        }
        this.budgetService.saveBudget({
            id: '', // será gerado no service
            name,
            salary: this.salary,
            expenses: this.expenses,
            categories: this.categories,
            date: new Date()
        });
        this.loadSavedBudgets();
        alert('Budget salvo com sucesso!');
    }

    getSavedBudgets(): Budget[] {
        return this.budgetService.getSavedBudgets();
    }

    /**
     * Carrega um budget salvo pelo nome.
     */
    loadBudgetByName(id: string) {
        const budget = this.budgetService.findBudgetById(id);
        if (!budget) {
            alert('Budget não encontrado.');
            return;
        }
        // this.salary = budget.salary;
        // this.expenses = budget.expenses;
        // this.categories = budget.categories;
        // this.chartShouldRender = true;
    }
}
