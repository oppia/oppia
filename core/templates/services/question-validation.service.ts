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
 * @fileoverview Service to validate a question.
 *
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { Question } from 'domain/question/QuestionObjectFactory';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { InteractionSpecsConstants, InteractionSpecsKey } from 'pages/interaction-specs.constants';

@Injectable({
  providedIn: 'root'
})
export class QuestionValidationService {
  constructor(
    private responsesService: ResponsesService,
    private stateEditorService: StateEditorService
  ) { }

  isQuestionValid(
      question: Question | null | undefined,
      misconceptionsBySkill: MisconceptionSkillMap): boolean {
    if (question === undefined || question === null) {
      return false;
    }

    return !(
      this.getValidationErrorMessage(question) ||
      question.getUnaddressedMisconceptionNames(
        misconceptionsBySkill
      ).length > 0 ||
      !this.stateEditorService.isCurrentSolutionValid());
  }

  // Returns 'null' when the message is valid.
  getValidationErrorMessage(question: Question): string | null {
    const interaction = question.getStateData().interaction;
    const interactionId = interaction.id as InteractionSpecsKey;
    const questionContent = question.getStateData().content._html;
    if (questionContent.length === 0) {
      return 'Please enter a question.';
    }
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    // Check if interaction answer choices have same number of answer groups.
    // for multiple choice and item selection. item selection logic seems
    // complicated. How to not duplicate?
    if (
      !this.responsesService.shouldHideDefaultAnswerGroup() &&
      interaction.defaultOutcome?.feedback._html.length === 0
    ) {
      return 'Please enter a feedback for the default outcome.';
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specified';
    }
    if (
      !interaction.solution &&
      InteractionSpecsConstants.INTERACTION_SPECS[
        interactionId
      ].can_have_solution
    ) {
      return 'A solution must be specified';
    }
    const answerGroups = question.getStateData().interaction.answerGroups;
    let atLeastOneAnswerCorrect = false;
    for (const answerGroup of answerGroups) {
      if (answerGroup.outcome.labelledAsCorrect) {
        atLeastOneAnswerCorrect = true;
        continue;
      }
    }
    if (!atLeastOneAnswerCorrect) {
      return 'At least one answer should be marked correct';
    }
    return null;
  }
}

angular.module('oppia').factory(
  'QuestionValidationService', downgradeInjectable(QuestionValidationService));
