// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for teach oppia modal.
 */

import {Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AngularNameService} from 'pages/exploration-editor-page/services/angular-name.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from 'pages/exploration-player-page/services/answer-classification.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {TrainingDataService} from '../../training-panel/training-data.service';
import {TrainingModalService} from '../../training-panel/training-modal.service';
import {TruncateInputBasedOnInteractionAnswerTypePipe} from 'filters/truncate-input-based-on-interaction-answer-type.pipe';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants';
import {LoggerService} from 'services/contextual/logger.service';
import {State} from 'domain/state/StateObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';
import {TeachOppiaModalBackendApiService} from './teach-oppia-modal-backend-api.service';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';

export interface UnresolvedAnswer {
  answer: InteractionAnswer;
  answerTemplate: string;
  classificationResult: AnswerClassificationResult;
  feedbackHtml: string;
}

@Component({
  selector: 'oppia-teach-oppia-modal',
  templateUrl: './teach-oppia-modal.component.html',
})
export class TeachOppiaModalComponent
  extends ConfirmOrCancelModal
  implements OnInit, OnDestroy
{
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  _stateName!: string;
  _state!: State;
  _explorationId!: string;
  unresolvedAnswers!: UnresolvedAnswer[];
  loadingDotsAreShown!: boolean;
  rulesService!: InteractionRulesService;
  interactionId!: string;
  // Timeout for the toast that is shown when a response has
  // been confirmed or fixed.
  TOAST_TIMEOUT: number = 2000;

  constructor(
    private alertsService: AlertsService,
    private angularNameService: AngularNameService,
    private answerClassificationService: AnswerClassificationService,
    private contextService: ContextService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationStatesService: ExplorationStatesService,
    private injector: Injector,
    private loggerService: LoggerService,
    private ngbActiveModal: NgbActiveModal,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private teachOppiaModalBackendApiService: TeachOppiaModalBackendApiService,
    private trainingDataService: TrainingDataService,
    private trainingModalService: TrainingModalService,
    private truncateInputBasedOnInteractionAnswerTypePipe: TruncateInputBasedOnInteractionAnswerTypePipe,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  fetchAndShowUnresolvedAnswers(expId: string, stateName: string): void {
    let unresolvedAnswersUrl = this.urlInterpolationService.interpolateUrl(
      '/createhandler/get_top_unresolved_answers/' + '<exploration_id>',
      {
        exploration_id: expId,
      }
    );

    this.teachOppiaModalBackendApiService
      .fetchTeachOppiaModalDataAsync(unresolvedAnswersUrl, {
        params: {
          state_name: stateName,
        },
      })
      .then(
        response => {
          this.showUnresolvedAnswers(response.data.unresolved_answers);
        },
        response => {
          this.loggerService.error(
            'Error occurred while fetching unresolved answers ' +
              'for exploration ' +
              this._explorationId +
              ' state ' +
              this._stateName +
              ': ' +
              response.data
          );
          this.showUnresolvedAnswers([]);
        }
      );
  }

  showUnresolvedAnswers(
    unresolvedAnswers: {answer: InteractionAnswer}[]
  ): void {
    this.loadingDotsAreShown = false;
    this.unresolvedAnswers = [];

    unresolvedAnswers.forEach((item: {answer: InteractionAnswer}) => {
      let answer = item.answer;
      let classificationResult =
        this.answerClassificationService.getMatchingClassificationResult(
          this._stateName,
          this._state.interaction,
          answer,
          this.rulesService
        );
      let classificationType =
        classificationResult.classificationCategorization;
      if (
        classificationType !==
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION &&
        classificationType !==
          ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION &&
        !this.trainingDataService.isConfirmedUnclassifiedAnswer(answer)
      ) {
        let answerTemplate = this.explorationHtmlFormatterService.getAnswerHtml(
          answer,
          this.stateInteractionIdService.savedMemento,
          this.stateCustomizationArgsService.savedMemento
        );
        let feedbackHtml = classificationResult.outcome.feedback.html;

        this.unresolvedAnswers.push({
          answer: answer,
          answerTemplate: answerTemplate,
          classificationResult: classificationResult,
          feedbackHtml: feedbackHtml,
        });
      }
    });
  }

  confirmAnswerAssignment(answerIndex: number): void {
    const unresolvedAnswer = this.unresolvedAnswers[answerIndex];
    this.unresolvedAnswers.splice(answerIndex, 1);

    const classificationType =
      unresolvedAnswer.classificationResult.classificationCategorization;
    const truncatedAnswer =
      this.truncateInputBasedOnInteractionAnswerTypePipe.transform(
        unresolvedAnswer.answer,
        this.interactionId,
        12
      );
    const successToast =
      'The answer ' + truncatedAnswer + ' has been successfully trained.';

    if (
      classificationType ===
      ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION
    ) {
      this.trainingDataService.associateWithDefaultResponse(
        unresolvedAnswer.answer
      );
      this.alertsService.addSuccessMessage(successToast, this.TOAST_TIMEOUT);
      return;
    }

    this.trainingDataService.associateWithAnswerGroup(
      unresolvedAnswer.classificationResult.answerGroupIndex,
      unresolvedAnswer.answer
    );
    this.alertsService.addSuccessMessage(successToast, this.TOAST_TIMEOUT);
  }

  openTrainUnresolvedAnswerModal(answerIndex: number): void {
    const unresolvedAnswer = this.unresolvedAnswers[answerIndex];
    const answer = unresolvedAnswer.answer;

    let interactionId = this.stateInteractionIdService.savedMemento;
    this.trainingModalService.openTrainUnresolvedAnswerModal(
      answer,
      interactionId,
      answerIndex
    );
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.trainingModalService.onFinishTrainingCallback.subscribe(
        finishTrainingResult => {
          this.unresolvedAnswers.splice(finishTrainingResult.answerIndex, 1);
          const truncatedAnswer =
            this.truncateInputBasedOnInteractionAnswerTypePipe.transform(
              finishTrainingResult.answer,
              this.interactionId,
              12
            );
          const successToast =
            'The response for ' + truncatedAnswer + ' has been fixed.';

          this.alertsService.addSuccessMessage(
            successToast,
            this.TOAST_TIMEOUT
          );
        }
      )
    );

    this._explorationId = this.contextService.getExplorationId();
    let stateName = this.stateEditorService.getActiveStateName();
    if (stateName) {
      this._stateName = stateName;
      this._state = this.explorationStatesService.getState(this._stateName);
      this.interactionId = this.stateInteractionIdService.savedMemento;
    }

    const rulesServiceName =
      this.angularNameService.getNameOfInteractionRulesService(
        this.interactionId
      );

    // Inject RulesService dynamically.
    this.rulesService = this.injector.get(rulesServiceName);

    this.loadingDotsAreShown = true;
    this.fetchAndShowUnresolvedAnswers(this._explorationId, this._stateName);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
