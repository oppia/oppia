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
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-create-feedback-thread-modal',
  templateUrl: './create-feedback-thread-modal.component.html',
})
export class CreateFeedbackThreadModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private alertsService: AlertsService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {}

  newThreadSubject = '';
  newThreadText = '';

  create(newThreadSubject: string, newThreadText: string): void {
    if (!newThreadSubject) {
      this.alertsService.addWarning('Please specify a thread subject.');
      return;
    }
    if (!newThreadText) {
      this.alertsService.addWarning('Please specify a message.');
      return;
    }
    this.ngbActiveModal.close({
      newThreadSubject: newThreadSubject,
      newThreadText: newThreadText,
    });
  }
}
