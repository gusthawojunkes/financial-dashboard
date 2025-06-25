import {Expense} from './expense.model';
import {BudgetCategory} from './budget-category.model';

export interface Budget {
    id: string;
    name: string;
    salary: number;
    expenses: Expense[];
    categories: BudgetCategory[];
    date: Date;
}
