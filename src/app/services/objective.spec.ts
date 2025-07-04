import {TestBed} from '@angular/core/testing';

import {ObjectiveService} from './objective';

describe('Objective', () => {
    let service: ObjectiveService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ObjectiveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
