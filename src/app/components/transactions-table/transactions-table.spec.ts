import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TransactionsTableComponent} from './transactions-table';

describe('TransactionsTable', () => {
    let component: TransactionsTableComponent;
    let fixture: ComponentFixture<TransactionsTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TransactionsTableComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TransactionsTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
