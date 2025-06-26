import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Transaction} from '../../models/transaction.model';
import {NgOptimizedImage} from '@angular/common';
import {CommonModule} from '@angular/common';
import CategoryHelper from '../../helper/category.helper';
import {TransactionsTableComponent} from '../transactions-table/transactions-table';

@Component({
    selector: 'app-categorie-summary',
    standalone: true,
    imports: [
        CommonModule,
        NgOptimizedImage,
        TransactionsTableComponent
    ],
    templateUrl: './category-summary.html',
    styleUrl: './category-summary.scss'
})
export class CategorySummaryComponent implements OnChanges {
    @Input() transactions: Transaction[] = [];
    summaryRows: { category: string; received: number; spent: number; percentSpent: number }[] = [];
    showModal = false;
    selectedCategory: string = "";

    ngOnChanges(changes: SimpleChanges) {
        if (changes['transactions']) {
            this.calculateSummary();
        }
    }

    calculateSummary() {
        const categoryMap: { [key: string]: { received: number; spent: number } } = {};
        let totalSpent = 0;
        for (const t of this.transactions) {
            const cat = t.category || 'Sem categoria';
            if (!categoryMap[cat]) categoryMap[cat] = {received: 0, spent: 0};
            if (t.value > 0) categoryMap[cat].received += t.value;
            else {
                categoryMap[cat].spent += Math.abs(t.value);
                totalSpent += Math.abs(t.value);
            }
        }
        this.summaryRows = Object.keys(categoryMap).map(cat => ({
            category: cat,
            received: categoryMap[cat].received,
            spent: categoryMap[cat].spent,
            percentSpent: totalSpent > 0 ? (categoryMap[cat].spent / totalSpent) * 100 : 0
        })).sort((a, b) => b.spent - a.spent);
    }

    getCategoryIcon(category: string): string {
        return CategoryHelper.getCategoryIcon(category);
    }

    getCategoryColor(category: string): string {
        return CategoryHelper.getCategoryColor(category);
    }

    openCategoryModal(category: string) {
        this.selectedCategory = category;
        this.showModal = true;
    }

    closeCategoryModal() {
        this.showModal = false;
        this.selectedCategory = "";
    }

    getTransactionsByCategory(category: string) {
        return this.transactions.filter(t => t.category === category);
    }
}
