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
 * @fileoverview Component for the assessment instruction panel.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';
import './assessment-instruction-panel.component.css';

@Component({
  selector: 'oppia-assessment-instruction-panel',
  templateUrl: './assessment-instruction-panel.component.html',
  styleUrls: ['./assessment-instruction-panel.component.css'],
})
export class AssessmentInstructionPanelComponent {
  @Input() certificateId = '';
  @Output() startAssessment = new EventEmitter<void>();

  // STUBBED DATA: certificateTitle will eventually be populated from the
  // CertificateAssessmentOfferingModel record identified by
  // this.certificateId (same record used on the intro card), so both
  // screens stay in sync. The instructions list below is generic and
  // applies to every certificate assessment, so it is expected to stay
  // hardcoded here rather than come from the backend.
  certificateTitle = 'Everyday Arithmetic & Number Confidence';

  instructionsHeading = "Before you begin, here's what to expect:";

  instructions: string[] = [
    "You'll have 60 minutes to complete the assessment.",
    'If the timer runs out, your assessment will be auto-submitted.',
    "You'll see one question at a time.",
    'Use the Back (<-) and Next (->) arrows to move between questions.',
    'You can review and change your answers at any time before ' +
      'submitting.',
    'Your answers are final only when you click "Submit Assessment" ' +
      'at the end of the assessment.',
    'Unanswered questions will be marked as Incorrect answers.',
    "You may take the assessment multiple times. If you don't pass, " +
      'we recommend reviewing the lessons before trying again.',
    'If your internet connection drops or you exit the assessment ' +
      'before submitting, your progress will not be saved.',
    'In that case, you can start the assessment again later, which ' +
      'will begin a new attempt.',
  ];

  onStartAssessment(): void {
    this.startAssessment.emit();
  }
}
