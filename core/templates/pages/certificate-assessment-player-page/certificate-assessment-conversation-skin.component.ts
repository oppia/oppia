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
 * @fileoverview Component for the certificate assessment conversation skin,
 * i.e. the question-by-question player screen (progress bar, question card,
 * and navigation actions).
 */

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssessmentQuestion} from 'domain/certificate-assessment/certificate-assessment.model';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import './certificate-assessment-conversation-skin.component.css';

@Component({
  selector: 'oppia-certificate-assessment-conversation-skin',
  templateUrl: './certificate-assessment-conversation-skin.component.html',
  styleUrls: ['./certificate-assessment-conversation-skin.component.css'],
})
export class CertificateAssessmentConversationSkinComponent implements OnInit {
  @Input() currentQuestion!: AssessmentQuestion;
  @Input() currentQuestionIndex = 0;
  @Input() totalQuestions = 0;
  @Input() progressPercentage = 0;
  @Input() isLastQuestion = false;
  @Input() interactionHtml = '';
  // Previously recorded answer for the current question, restored into the
  // interaction so the learner sees their earlier input after navigating away
  // and back. Consumed by the interaction via the `[last-answer]` binding in
  // the generated interaction HTML (see exploration-html-formatter.service).
  @Input() lastAnswer: InteractionAnswer | null = null;

  @Output() previousQuestion = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() submitAssessment = new EventEmitter<void>();

  OPPIA_AVATAR_IMAGE_URL!: string;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private currentInteractionService: CurrentInteractionService
  ) {}

  ngOnInit(): void {
    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
  }

  onPreviousQuestion(): void {
    this.previousQuestion.emit();
  }

  onNextQuestion(): void {
    // Interactions with their own submit handlers (e.g. ImageClickInput) do
    // not register a submit function, so only submit when one is registered.
    if (this.currentInteractionService.isSubmitAnswerFnRegistered()) {
      this.currentInteractionService.submitAnswer();
    }
    this.nextQuestion.emit();
  }

  // The interaction only reads `lastAnswer` when it is (re)built, so we must
  // change `htmlData` whenever the stored answer changes to force a rebuild
  // and re-apply the pre-populated value. A trailing comment with the encoded
  // answer is harmless to the parsed interaction tag but makes the string
  // unique per answer, guaranteeing the interaction refreshes.
  get cachedInteractionHtml(): string {
    const answerToken =
      this.lastAnswer === null
        ? 'null'
        : JSON.stringify(this.lastAnswer).replace(/--/g, '__');
    return this.interactionHtml + '<!-- answer:' + answerToken + ' -->';
  }

  onSubmitAssessment(): void {
    if (this.currentInteractionService.isSubmitAnswerFnRegistered()) {
      this.currentInteractionService.submitAnswer();
    }
    this.submitAssessment.emit();
  }
}
