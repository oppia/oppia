// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Modal shown when a certificate assessment has unanswered questions.
 */

import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-unanswered-question-modal',
  templateUrl: './unanswered-question-modal.component.html',
  styleUrls: ['./unanswered-question-modal.component.css'],
})
export class UnansweredQuestionModalComponent {
  @Input() unansweredQuestionCount = 3;

  constructor(private ngbActiveModal: NgbActiveModal) {}

  goBackToAssessment(): void {
    this.ngbActiveModal.dismiss();
  }

  submitAnyway(): void {
    this.ngbActiveModal.close();
  }
}
