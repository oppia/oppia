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
 * @fileoverview Component for the assessment conversation skin.
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';

interface AssessmentQuestion {
  prompt: string;
  choices: string[];
}

@Component({
  selector: 'oppia-certificate-assessment-conversation-skin',
  templateUrl: './certificate-assessment-conversation-skin.component.html',
})
export class CertificateAssessmentConversationSkinComponent {
  @Input() currentQuestion!: AssessmentQuestion;
  @Input() currentQuestionIndex = 0;
  @Input() totalQuestions = 0;
  @Input() progressPercentage = 0;
  @Input() isLastQuestion = false;
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() submitAssessment = new EventEmitter<void>();
}
