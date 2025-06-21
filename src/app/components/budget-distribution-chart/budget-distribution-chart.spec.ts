import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetDistributionChart } from './budget-distribution-chart';

describe('BudgetDistributionChart', () => {
  let component: BudgetDistributionChart;
  let fixture: ComponentFixture<BudgetDistributionChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetDistributionChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetDistributionChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
