import {Injectable} from '@angular/core';
import {Budget} from '../models/budget.model';
import {LocalStorageService} from './local-storage';
import StringHelper from '../helper/string.helper';

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

    findBudgetById(id: string): Budget | null {
        const budgets = this.getSavedBudgets();
        return budgets.find(b => b.id === id) || null;
    }

    getSavedBudgets(): Budget[] {
        return this.localStorageService.getItem<Budget[]>('budgets') || [];
    }

    setSavedBudgets(budgets: Budget[]) {
        this.localStorageService.setItem<Budget[]>('budgets', budgets);
    }

    saveBudget(budget: Budget) {
        const budgets = this.getSavedBudgets();
        let existingIndex = -1;
        if (budget.id) {
            existingIndex = budgets.findIndex(b => b.id === budget.id);
        }
        if (!budget.id) {
            budget.id = StringHelper.generateUUID();
        }
        if (existingIndex > -1) {
            budgets[existingIndex] = budget;
        } else {
            budgets.push(budget);
        }

        this.setSavedBudgets(budgets);
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
