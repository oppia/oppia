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
 * @fileoverview Component for asking learner for answer details.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { InteractionRulesService } from '../services/answer-classification.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { LearnerAnswerInfoService } from '../services/learner-answer-info.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';

interface SubmitAnswerEventDataInterface {
  currentAnswer: string;
  rulesService: InteractionRulesService;
}

@Component({
  selector: 'oppia-learner-answer-info-card',
  templateUrl: './learner-answer-info-card.component.html'
})
export class LearnerAnswerInfoCard {
  @Output() submitAnswer: EventEmitter<SubmitAnswerEventDataInterface> = (
    new EventEmitter());

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  interaction!: Interaction;
  answerDetails!: string;

  constructor(
    private explorationEngineService: ExplorationEngineService,
    private explorationHtmlFormatter: ExplorationHtmlFormatterService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private playerTranscriptService: PlayerTranscriptService
  ) {
    this.interaction = this.explorationEngineService.getState().interaction;
  }

  submitLearnerAnswerInfo(): void {
    this.learnerAnswerInfoService.recordLearnerAnswerInfo(
      this.answerDetails);
    this.playerTranscriptService.addNewInput(this.answerDetails, false);
    this.playerTranscriptService.addNewResponse(
      this.learnerAnswerInfoService.getSolicitAnswerDetailsFeedback());
    this.submitAnswer.emit({
      currentAnswer: this.learnerAnswerInfoService.getCurrentAnswer(),
      rulesService:
      this.learnerAnswerInfoService.getCurrentInteractionRulesService()});
  }

  displayCurrentAnswer(): string {
    return this.explorationHtmlFormatter.getAnswerHtml(
      this.learnerAnswerInfoService.getCurrentAnswer(), this.interaction.id,
      this.interaction.customizationArgs);
  }
}

angular.module('oppia').directive('oppiaLearnerAnswerInfoCard',
  downgradeComponent({ component: LearnerAnswerInfoCard }));
