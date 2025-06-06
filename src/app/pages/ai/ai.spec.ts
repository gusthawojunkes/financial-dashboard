import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AIComponent } from './ai';

describe('Gemini', () => {
  let component: AIComponent;
  let fixture: ComponentFixture<AIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
