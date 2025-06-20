import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BudgetService} from '../../services/budget';
import {Budget} from '../../models/budget.model';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-budget-details',
    imports: [
        CommonModule,
        CurrencyPipe,
        DecimalPipe,
        DatePipe
    ],
    templateUrl: './budget-details.html',
    styleUrl: './budget-details.scss'
})
export class BudgetDetailsComponent implements OnInit {
    budget: Budget | null = null;

    constructor(private route: ActivatedRoute, private budgetService: BudgetService) {
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.budget = this.budgetService.findBudgetById(id);
        }
    }
}
