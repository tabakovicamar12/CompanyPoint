import { TestBed } from '@angular/core/testing';

import { AuthLogs } from './auth-logs';

describe('AuthLogs', () => {
  let service: AuthLogs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthLogs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
