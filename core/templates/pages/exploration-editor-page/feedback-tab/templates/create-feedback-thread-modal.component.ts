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
 * @fileoverview Component for create feedback thread modal.
 */

import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-create-feedback-thread-modal',
  templateUrl: './create-feedback-thread-modal.component.html',
})
export class CreateFeedbackThreadModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  constructor(private ngbActiveModal: NgbActiveModal) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {}

  newThreadSubject = '';
  newThreadText = '';
  readonly SUBJECT_MIN_CHARS = AppConstants.FEEDBACK_SUBJECT_MIN_CHAR_LIMIT;
  readonly SUBJECT_MAX_CHARS = AppConstants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT;
  readonly MESSAGE_MIN_CHARS = AppConstants.FEEDBACK_MESSAGE_MIN_CHAR_LIMIT;
  readonly MESSAGE_MAX_CHARS = AppConstants.MAX_REVIEW_MESSAGE_LENGTH;
  subjectValidationActive = false;
  messageValidationActive = false;

  create(form: NgForm): void {
    const subjectValid = this.isSubjectValueValid();
    const messageValid = this.isMessageValueValid();
    this.subjectValidationActive = !subjectValid;
    this.messageValidationActive = !messageValid;
    if (!subjectValid || !messageValid || form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    const subject = this.newThreadSubject ? this.newThreadSubject.trim() : '';
    const message = this.newThreadText ? this.newThreadText.trim() : '';
    this.subjectValidationActive = false;
    this.messageValidationActive = false;
    this.ngbActiveModal.close({
      newThreadSubject: subject,
      newThreadText: message,
    });
  }

  isSubjectTooLong(): boolean {
    return (
      !!this.newThreadSubject &&
      this.newThreadSubject.length > this.SUBJECT_MAX_CHARS
    );
  }

  isMessageTooLong(): boolean {
    return (
      !!this.newThreadText && this.newThreadText.length > this.MESSAGE_MAX_CHARS
    );
  }

  onSubjectInputChange(): void {
    if (this.subjectValidationActive && this.isSubjectValueValid()) {
      this.subjectValidationActive = false;
    }
  }

  onMessageInputChange(): void {
    if (this.messageValidationActive && this.isMessageValueValid()) {
      this.messageValidationActive = false;
    }
  }

  isSubjectTrimmedEmpty(): boolean {
    return !(this.newThreadSubject || '').trim();
  }

  isMessageTrimmedEmpty(): boolean {
    return !(this.newThreadText || '').trim();
  }

  isSubjectTrimmedTooShort(): boolean {
    const subject = (this.newThreadSubject || '').trim();
    return !!subject && subject.length < this.SUBJECT_MIN_CHARS;
  }

  isMessageTrimmedTooShort(): boolean {
    const message = (this.newThreadText || '').trim();
    return !!message && message.length < this.MESSAGE_MIN_CHARS;
  }

  private isSubjectValueValid(): boolean {
    const subject = (this.newThreadSubject || '').trim();
    if (!subject) {
      return false;
    }
    if (
      subject.length < this.SUBJECT_MIN_CHARS ||
      subject.length > this.SUBJECT_MAX_CHARS
    ) {
      return false;
    }
    return true;
  }

  private isMessageValueValid(): boolean {
    const message = (this.newThreadText || '').trim();
    if (!message) {
      return false;
    }
    if (
      message.length < this.MESSAGE_MIN_CHARS ||
      message.length > this.MESSAGE_MAX_CHARS
    ) {
      return false;
    }
    return true;
  }
}
