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
 * i.e. the question-by-question player screen (progress bar, timer,
 * question card, and navigation actions).
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssessmentQuestion} from './certificate-assessment-player-page.component';
import './certificate-assessment-conversation-skin.component.css';

@Component({
  selector: 'oppia-certificate-assessment-conversation-skin',
  templateUrl: './certificate-assessment-conversation-skin.component.html',
  styleUrls: ['./certificate-assessment-conversation-skin.component.css'],
})
export class CertificateAssessmentConversationSkinComponent
  implements OnInit, OnChanges
{
  @Input() currentQuestion!: AssessmentQuestion;
  @Input() currentQuestionIndex = 0;
  @Input() totalQuestions = 0;
  @Input() progressPercentage = 0;
  @Input() isLastQuestion = false;
  @Input() savedResponse = '';

  @Output() previousQuestion = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() submitAssessment = new EventEmitter<void>();
  @Output() responseChange = new EventEmitter<string>();

  OPPIA_AVATAR_IMAGE_URL!: string;
  selectedOptionIds: string[] = [];
  freeResponse = '';

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  ngOnInit(): void {
    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
    this.hydrateResponseFromSavedResponse();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentQuestion || changes.savedResponse) {
      this.hydrateResponseFromSavedResponse();
    }
  }

  private hydrateResponseFromSavedResponse(): void {
    this.freeResponse = '';
    this.selectedOptionIds = [];
    if (!this.savedResponse) {
      return;
    }
    if (
      this.currentQuestion?.type === 'multiple_choice' ||
      this.currentQuestion?.type === 'multiple_select'
    ) {
      this.selectedOptionIds = this.savedResponse.split(',').filter(Boolean);
    } else {
      this.freeResponse = this.savedResponse;
    }
  }

  isOptionSelected(optionId: string): boolean {
    return this.selectedOptionIds.includes(optionId);
  }

  selectSingleChoice(optionId: string): void {
    this.selectedOptionIds = [optionId];
    this.responseChange.emit(optionId);
  }

  toggleMultipleSelect(optionId: string): void {
    if (this.isOptionSelected(optionId)) {
      this.selectedOptionIds = this.selectedOptionIds.filter(
        id => id !== optionId
      );
    } else {
      this.selectedOptionIds = [...this.selectedOptionIds, optionId];
    }
    this.responseChange.emit(this.selectedOptionIds.join(','));
  }

  updateFreeResponse(value: string): void {
    this.freeResponse = value;
    this.responseChange.emit(value);
  }

  getQuestionInputType(): string {
    return this.currentQuestion?.type === 'numeric_input' ? 'number' : 'text';
  }

  onPreviousQuestion(): void {
    this.previousQuestion.emit();
  }

  onNextQuestion(): void {
    this.nextQuestion.emit();
  }

  onSubmitAssessment(): void {
    this.submitAssessment.emit();
  }
}
