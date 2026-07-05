// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for ErrorModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FrontendErrorBackendApiService} from 'services/frontend-error-backend-api.service';
import {ErrorModalComponent} from './error-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockFrontendErrorBackendApiService {
  reportErrorAsync(
    errorMessage: string,
    userDescription: string
  ): Promise<void> {
    return Promise.resolve();
  }
}

describe('Error Modal Component', () => {
  let component: ErrorModalComponent;
  let fixture: ComponentFixture<ErrorModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let frontendErrorBackendApiService: FrontendErrorBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: FrontendErrorBackendApiService,
          useClass: MockFrontendErrorBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    frontendErrorBackendApiService = TestBed.inject(
      FrontendErrorBackendApiService
    );

    spyOn(ngbActiveModal, 'close').and.stub();
    spyOn(ngbActiveModal, 'dismiss').and.stub();
    fixture.detectChanges();
  });

  it('should initialize correctly and toggle details', () => {
    expect(component.showDetails).toBeFalse();
    component.toggleDetails();
    expect(component.showDetails).toBeTrue();
    component.toggleDetails();
    expect(component.showDetails).toBeFalse();
  });

  it('should close the modal', () => {
    component.close();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should dismiss/cancel the modal', () => {
    component.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should send the error report successfully', fakeAsync(() => {
    spyOn(frontendErrorBackendApiService, 'reportErrorAsync').and.returnValue(
      Promise.resolve()
    );
    component.errorMessage = 'Sample test error message';
    component.description = 'Sample user description';

    component.sendReport();
    expect(component.isSubmitting).toBeTrue();
    tick();

    expect(
      frontendErrorBackendApiService.reportErrorAsync
    ).toHaveBeenCalledWith(
      'Sample test error message',
      'Sample user description'
    );
    expect(component.isSubmitting).toBeFalse();
    expect(component.reportSentSuccessfully).toBeTrue();
  }));

  it('should handle reporting failure gracefully', fakeAsync(() => {
    spyOn(frontendErrorBackendApiService, 'reportErrorAsync').and.returnValue(
      Promise.reject('error')
    );
    component.errorMessage = 'Sample test error message';
    component.description = 'Sample user description';

    component.sendReport();
    expect(component.isSubmitting).toBeTrue();
    tick();

    expect(
      frontendErrorBackendApiService.reportErrorAsync
    ).toHaveBeenCalledWith(
      'Sample test error message',
      'Sample user description'
    );
    expect(component.isSubmitting).toBeFalse();
    expect(component.reportSentSuccessfully).toBeFalse();
  }));

  it('should not submit report if already submitting', () => {
    spyOn(frontendErrorBackendApiService, 'reportErrorAsync');
    component.isSubmitting = true;
    component.sendReport();

    expect(
      frontendErrorBackendApiService.reportErrorAsync
    ).not.toHaveBeenCalled();
  });
});
