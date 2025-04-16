import {TestBed} from '@angular/core/testing';

import {NormalizeUrlCaseGuard} from './normalize-url-case.guard';

describe('NormalizeUrlCaseGuard', () => {
  let guard: NormalizeUrlCaseGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(NormalizeUrlCaseGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
