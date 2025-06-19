import {Injectable} from '@angular/core';
import {Budget} from '../models/budget.model';
import {LocalStorageService} from './local-storage';
import {Expense} from '../models/expense.model';

@Injectable({
    providedIn: 'root'
})
export class BudgetService {

    constructor(private localStorageService: LocalStorageService) {
    }

    findBudgetByName(name: string): Budget | null {
        const budgets = this.getSavedBudgets();
        return budgets.find(b => b.name === name) || null;
    }

    getSavedBudgets(): Budget[] {
        return this.localStorageService.getItem<Budget[]>('saved-budgets') || [];
    }

    saveBudget(budget: Budget) {
        const budgets = this.getSavedBudgets();
        const existingIndex = budgets.findIndex(b => b.name === budget.name);

        if (existingIndex > -1) {
            budgets[existingIndex] = budget;
        } else {
            budgets.push(budget);
        }

        this.localStorageService.setItem<Budget[]>('budgets', budgets);
    }

    getSuggestions() {
        return [
            {name: 'Moradia', percent: 30, category: 'moradia'},
            {name: 'Alimentação', percent: 15, category: 'alimentacao'},
            {name: 'Saúde', percent: 10, category: 'saude'},
            {name: 'Educação', percent: 4, category: 'educacao'},
            {name: 'Transporte', percent: 8, category: 'transporte'},
            {name: 'Lazer', percent: 10, category: 'lazer'},
            {name: 'Extra', percent: 8, category: 'extra'},
            {name: 'Investimentos', percent: 15, category: 'investimentos'},
        ];
    }

}
