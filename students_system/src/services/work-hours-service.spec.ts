import { TestBed } from '@angular/core/testing';

import { WorkHoursService } from './work-hours-service';

describe('WorkHoursService', () => {
  let service: WorkHoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkHoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
