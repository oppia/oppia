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
  @Input() certificateTitle = '';
  @Input() timeLimitInMinutes = 0;
  @Input() totalQuestions = 0;
  @Output() back = new EventEmitter<void>();
  @Output() startAssessment = new EventEmitter<void>();

  bannerTitleI18nKey = 'I18N_CERTIFICATE_ASSESSMENT';
  bannerButtonI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_BACK_BUTTON';
  instructionsHeadingI18nKey = 'I18N_ASSESSMENT_INSTRUCTIONS_HEADING';
  timeLimitInstructionI18nKey = 'I18N_ASSESSMENT_INSTRUCTION_TIME_LIMIT';
  questionCountInstructionI18nKey =
    'I18N_ASSESSMENT_INSTRUCTION_QUESTION_COUNT';
  startAssessmentButtonI18nKey = 'I18N_ASSESSMENT_START_BUTTON';

  // Remaining instructions are static text, so no interpolation params
  // are needed for them.
  staticInstructionI18nKeys: string[] = [
    'I18N_ASSESSMENT_INSTRUCTION_AUTO_SUBMIT',
    'I18N_ASSESSMENT_INSTRUCTION_ONE_QUESTION_AT_A_TIME',
    'I18N_ASSESSMENT_INSTRUCTION_NAVIGATION',
    'I18N_ASSESSMENT_INSTRUCTION_REVIEW_ANSWERS',
    'I18N_ASSESSMENT_INSTRUCTION_FINAL_SUBMISSION',
    'I18N_ASSESSMENT_INSTRUCTION_UNANSWERED_MARKED_INCORRECT',
    'I18N_ASSESSMENT_INSTRUCTION_MULTIPLE_ATTEMPTS',
    'I18N_ASSESSMENT_INSTRUCTION_PROGRESS_NOT_SAVED',
    'I18N_ASSESSMENT_INSTRUCTION_NEW_ATTEMPT',
  ];

  onBack(): void {
    this.back.emit();
  }

  onStartAssessment(): void {
    this.startAssessment.emit();
  }
}
