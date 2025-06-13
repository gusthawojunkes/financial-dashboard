import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TransactionService} from '../../services/transaction';
import {Transaction} from '../../models/transaction.model';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';

@Component({
    selector: 'app-transactions-details',
    templateUrl: './transactions-details.html',
    imports: [
        CommonModule,
        DatePipe,
        CurrencyPipe
    ],
    styleUrls: ['./transactions-details.scss']
})
export class TransactionsDetailsComponent implements OnInit {
    year!: number;
    month!: number;
    transactions: Transaction[] = [];

    constructor(
        private route: ActivatedRoute,
        private transactionService: TransactionService
    ) {
    }

    ngOnInit() {
        this.year = +this.route.snapshot.paramMap.get('year')!;
        this.month = +this.route.snapshot.paramMap.get('month')!;
        this.loadTransactions();
    }

    loadTransactions() {
        this.transactionService.getTransactionsByMonth(this.year, this.month)
            .subscribe((data: Transaction[]) => {
                console.log(data);
                this.transactions = data;
            });
    }
}

