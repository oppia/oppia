// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreateFeedbackThreadModalComponent.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {CreateFeedbackThreadModalComponent} from './create-feedback-thread-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgForm} from '@angular/forms';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Create Feedback Thread Modal Controller', function () {
  let component: CreateFeedbackThreadModalComponent;
  let fixture: ComponentFixture<CreateFeedbackThreadModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  const buildMockForm = (invalid: boolean): NgForm => {
    return {
      invalid: invalid,
      form: {
        markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
      },
    } as unknown as NgForm;
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateFeedbackThreadModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFeedbackThreadModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized', function () {
    expect(component.newThreadSubject).toEqual('');
    expect(component.newThreadText).toEqual('');
  });

  it('should not close modal when form is invalid', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(true);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = 'Message text 12345';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should close modal when form is valid', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = 'Message text 12345';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).not.toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      newThreadSubject: 'Subject 123',
      newThreadText: 'Message text 12345',
    });
  });

  it('should trim subject and message before closing modal', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = '  Subject 123  ';
    component.newThreadText = '\nMessage text 12345   ';

    component.create(mockForm);

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      newThreadSubject: 'Subject 123',
      newThreadText: 'Message text 12345',
    });
  });

  it('should not close modal when subject length exceeds limit', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'a'.repeat(component.SUBJECT_MAX_CHARS + 1);
    component.newThreadText = 'Message text 12345';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should not close modal when message length exceeds limit', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = 'a'.repeat(component.MESSAGE_MAX_CHARS + 1);

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should not close modal when subject shorter than limit', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'ab';
    component.newThreadText = 'Message text 12345';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should not close modal when message shorter than limit', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = '123456789';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should activate subject validation flag when subject invalid', function () {
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'ab';
    component.newThreadText = 'Message text 12345';

    component.create(mockForm);

    expect(component.subjectValidationActive).toBeTrue();
    expect(component.messageValidationActive).toBeFalse();
  });

  it('should clear subject validation flag after fixing value', function () {
    component.subjectValidationActive = true;
    component.newThreadSubject = 'Valid subject';

    component.onSubjectInputChange();

    expect(component.subjectValidationActive).toBeFalse();
  });

  it('should activate message validation flag when message invalid', function () {
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = '123456789';

    component.create(mockForm);

    expect(component.messageValidationActive).toBeTrue();
    expect(component.subjectValidationActive).toBeFalse();
  });

  it('should clear message validation flag after fixing value', function () {
    component.messageValidationActive = true;
    component.newThreadText = 'Message text 12345';

    component.onMessageInputChange();

    expect(component.messageValidationActive).toBeFalse();
  });
});
