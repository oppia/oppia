// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for the question player for an exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Question, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { DiagnosticTestModelData } from 'pages/diagnostic-test-player-page/diagnostic-test.model';
import { DiagnosticTestTopicStateData } from 'pages/diagnostic-test-player-page/diagnostic-test-topic-state.model';

@Injectable({
    providedIn: 'root'
})
export class DiagnosticTestPlayerEngineService {
  private answerIsBeingProcessed: boolean = false;
  private questions: Question[] = [];
  private currentIndex: number = null;
  private nextIndex: number = null;
  private diagnosticTestModelData;
  private diagnosticTestTopicStateData;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contextService: ContextService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private questionObjectFactory: QuestionObjectFactory) {
  }

  init(
      config,
      diagnosticTestModelData,
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback?: () => void
  ) {
    this.diagnosticTestModelData = diagnosticTestModelData;
  }

  submitAnswer(): boolean {
    return false;
  }
}