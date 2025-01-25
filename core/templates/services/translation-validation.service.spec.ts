import {TestBed} from '@angular/core/testing';

import {TranslationValidationService} from './translation-validation.service';

describe('TranslationValidationService', () => {
  let service: TranslationValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
