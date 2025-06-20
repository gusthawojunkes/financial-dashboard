import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BudgetService} from '../../services/budget';
import {Budget} from '../../models/budget.model';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {CommonModule} from '@angular/common';
import {BudgetSummary} from '../../components/budget-summary/budget-summary';

@Component({
    selector: 'app-budget-details',
    imports: [
        CommonModule,
        CurrencyPipe,
        DecimalPipe,
        DatePipe,
        BudgetSummary
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

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.budget = this.budgetService.findBudgetById(id);
        }
    }
}
