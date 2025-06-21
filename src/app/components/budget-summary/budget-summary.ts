import { Component, Input } from '@angular/core';
import {CurrencyPipe, DecimalPipe} from '@angular/common';

@Component({
    selector: 'app-budget-summary',
    standalone: true,
    templateUrl: './budget-summary.html',
    imports: [
        DecimalPipe,
        CurrencyPipe
    ],
    styleUrl: './budget-summary.scss'
})
export class BudgetSummary {
  @Input() salary: number = 0;
  @Input() totalExpenses: number = 0;


    get remaining(): number {
        return this.salary - this.totalExpenses;
    }

    get percentUsed(): number {
        if (!this.salary || this.salary === 0) return 0;
        return (this.totalExpenses / this.salary) * 100;
    }

}
