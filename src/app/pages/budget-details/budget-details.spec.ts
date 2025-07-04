import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BudgetDetailsComponent} from './budget-details';

describe('BudgetDetails', () => {
    let component: BudgetDetailsComponent;
    let fixture: ComponentFixture<BudgetDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BudgetDetailsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BudgetDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
