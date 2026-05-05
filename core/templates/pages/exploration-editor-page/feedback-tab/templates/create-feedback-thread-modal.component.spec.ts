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
import {FormsModule, NgForm} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

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
      imports: [FormsModule, TranslateModule.forRoot()],
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

  it('should close modal for trimmed punctuation-only input', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = '  ???  ';
    component.newThreadText = '  .....  ';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).not.toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      newThreadSubject: '???',
      newThreadText: '.....',
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

  it('should report subject as not too long when within limit', function () {
    component.newThreadSubject = 'Valid subject';

    expect(component.isSubjectTooLong()).toBeFalse();
  });

  it('should report message as not too long when within limit', function () {
    component.newThreadText = 'Valid message';

    expect(component.isMessageTooLong()).toBeFalse();
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
    component.newThreadText = '1234';

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

  it('should not close modal for whitespace-only input', function () {
    spyOn(ngbActiveModal, 'close').and.callThrough();
    const mockForm = buildMockForm(false);
    component.newThreadSubject = '   ';
    component.newThreadText = '     ';

    component.create(mockForm);

    expect(mockForm.form.markAllAsTouched).toHaveBeenCalled();
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
    expect(component.subjectValidationActive).toBeTrue();
    expect(component.messageValidationActive).toBeTrue();
  });

  it('should identify when trimmed subject is empty', function () {
    component.newThreadSubject = '   ';

    expect(component.isSubjectTrimmedEmpty()).toBeTrue();
  });

  it('should identify when trimmed subject is too short', function () {
    component.newThreadSubject = '? ';

    expect(component.isSubjectTrimmedTooShort()).toBeTrue();
  });

  it('should clear subject validation flag after fixing value', function () {
    component.subjectValidationActive = true;
    component.newThreadSubject = 'Valid subject';

    component.onSubjectInputChange();

    expect(component.subjectValidationActive).toBeFalse();
  });

  it('should keep subject validation flag active when value is still invalid', function () {
    component.subjectValidationActive = true;
    component.newThreadSubject = '  ';

    component.onSubjectInputChange();

    expect(component.subjectValidationActive).toBeTrue();
  });

  it('should activate message validation flag when message invalid', function () {
    const mockForm = buildMockForm(false);
    component.newThreadSubject = 'Subject 123';
    component.newThreadText = '1234';

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

  it('should identify when trimmed message is empty', function () {
    component.newThreadText = '   ';

    expect(component.isMessageTrimmedEmpty()).toBeTrue();
  });

  it('should identify when trimmed message is too short', function () {
    component.newThreadText = '?   ';

    expect(component.isMessageTrimmedTooShort()).toBeTrue();
  });

  it('should keep message validation flag active when value is still invalid', function () {
    component.messageValidationActive = true;
    component.newThreadText = '  ';

    component.onMessageInputChange();

    expect(component.messageValidationActive).toBeTrue();
  });
});
