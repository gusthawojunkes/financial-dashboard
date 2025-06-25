import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CategorieSummaryComponent} from './categorie-summary';

describe('CategorieSummary', () => {
    let component: CategorieSummaryComponent;
    let fixture: ComponentFixture<CategorieSummaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategorieSummaryComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CategorieSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
