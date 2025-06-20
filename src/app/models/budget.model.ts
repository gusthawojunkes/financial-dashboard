import {Expense} from './expense.model';
import {Category} from './categorie.model';

export interface Budget {
    id: string;
    name: string;
    salary: number;
    expenses: Expense[];
    categories: Category[];
    date: Date;
}
