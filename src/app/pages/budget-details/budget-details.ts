import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BudgetService} from '../../services/budget';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {CommonModule} from '@angular/common';
import {BudgetSummary} from '../../components/budget-summary/budget-summary';
import {BudgetDistributionChart} from '../../components/budget-distribution-chart/budget-distribution-chart';
import {Budget} from '../../models/budget.model';

@Component({
    selector: 'app-budget-details',
    imports: [
        CommonModule,
        CurrencyPipe,
        DecimalPipe,
        DatePipe,
        BudgetSummary,
        BudgetDistributionChart,
    ],
    templateUrl: './budget-details.html',
    styleUrl: './budget-details.scss'
})
export class BudgetDetailsComponent implements OnInit {
    budget: Budget | null = null;

    constructor(private route: ActivatedRoute, private budgetService: BudgetService) {
    }

    get totalExpenses(): number {
        const expensesSum = this.budget?.expenses.reduce((sum, exp) => sum + exp.value, 0);
        const categoriesSum = this.budget?.categories.reduce((catSum, cat) => catSum + cat.expenses.reduce((sum, exp) => sum + exp.value, 0), 0);
        return (expensesSum || 0) + (categoriesSum || 0);
    }

    get totalExpensesQuantity(): number {
        const expensesCount = this.budget?.expenses.length || 0;
        const categoriesCount = this.budget?.categories.reduce((count, cat) => count + cat.expenses.length, 0) || 0;
        return expensesCount + categoriesCount;
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.budget = this.budgetService.findBudgetById(id);
        }
    }
}
