import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {CurrencyPipe} from '@angular/common';
import {Transaction} from '../../models/transaction.model';
import {TransactionService} from '../../services/transaction';

@Component({
    selector: 'app-revenue-summary',
    standalone: true,
    imports: [
        CurrencyPipe
    ],
    templateUrl: './revenue-summary.html',
    styleUrl: './revenue-summary.scss'
})
export class RevenueSummaryComponent implements OnInit, OnChanges {

    @Input() transactions: Transaction[] = [];

    summary = {revenue: 0, expenses: 0, balance: 0};

    constructor(private transactionService: TransactionService) {
    }

    calculateSummary() {
        this.summary = this.transactionService.calculateSummary(this.transactions);
    }

    ngOnInit() {
        this.calculateSummary();
    }

    ngOnChanges() {
        this.calculateSummary();
    }
}
