import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Transaction} from '../../models/transaction.model';
import {DecimalPipe} from '@angular/common';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-categorie-summary',
    standalone: true,
    imports: [
        CommonModule,
        DecimalPipe
    ],
    templateUrl: './categorie-summary.html',
    styleUrl: './categorie-summary.scss'
})
export class CategorieSummaryComponent implements OnChanges {
    @Input() transactions: Transaction[] = [];
    summaryRows: { category: string; received: number; spent: number }[] = [];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['transactions']) {
            this.calculateSummary();
        }
    }

    calculateSummary() {
        const categoryMap: { [key: string]: { received: number; spent: number } } = {};
        for (const t of this.transactions) {
            const cat = t.category || 'Sem categoria';
            if (!categoryMap[cat]) categoryMap[cat] = {received: 0, spent: 0};
            if (t.value > 0) categoryMap[cat].received += t.value;
            else categoryMap[cat].spent += Math.abs(t.value);
        }
        this.summaryRows = Object.keys(categoryMap).map(cat => ({
            category: cat,
            received: categoryMap[cat].received,
            spent: categoryMap[cat].spent
        }));
    }
}

