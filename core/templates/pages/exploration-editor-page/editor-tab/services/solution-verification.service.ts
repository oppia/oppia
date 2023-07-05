// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for solution verification.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { InteractionRulesRegistryService } from
  'services/interaction-rules-registry.service';

@Injectable({
  providedIn: 'root'
})
export class SolutionVerificationService {
  constructor(
      private interactionRulesRegistryService: InteractionRulesRegistryService,
      private answerClassificationService: AnswerClassificationService,
      private stateEditorService: StateEditorService) {}

  verifySolution(
      stateName: string,
      interaction: Interaction,
      correctAnswer: InteractionAnswer): boolean {
    if (interaction.id === null) {
      throw new Error('Interaction ID must not be null');
    }
    let rulesService = this.interactionRulesRegistryService.
      getRulesServiceByInteractionId(interaction.id);
    let result =
      this.answerClassificationService.getMatchingClassificationResult(
        stateName, interaction, correctAnswer, rulesService
      );
    if (this.stateEditorService.isInQuestionMode()) {
      return result.outcome.labelledAsCorrect;
    }
    return stateName !== result.outcome.dest;
  }
}
angular.module('oppia').factory('SolutionVerificationService',
  downgradeInjectable(SolutionVerificationService));
