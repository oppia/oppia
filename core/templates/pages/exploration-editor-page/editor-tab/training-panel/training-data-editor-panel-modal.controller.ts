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
 * @fileoverview Controller for TrainingDataEditorPanelService modal.
 */

import { Component, Injector, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants';
import { AngularNameService } from 'pages/exploration-editor-page/services/angular-name.service';
import { AlgebraicExpressionInputRulesService } from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import { CodeReplRulesService } from 'interactions/CodeRepl/directives/code-repl-rules.service';
import { ContinueRulesService } from 'interactions/Continue/directives/continue-rules.service';
import { FractionInputRulesService } from 'interactions/FractionInput/directives/fraction-input-rules.service';
import { GraphInputRulesService } from 'interactions/GraphInput/directives/graph-input-rules.service';
import { ImageClickInputRulesService } from 'interactions/ImageClickInput/directives/image-click-input-rules.service';
import { InteractiveMapRulesService } from 'interactions/InteractiveMap/directives/interactive-map-rules.service';
import { MathEquationInputRulesService } from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import { NumericExpressionInputRulesService } from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import { NumericInputRulesService } from 'interactions/NumericInput/directives/numeric-input-rules.service';
import { PencilCodeEditorRulesService } from 'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import { SetInputRulesService } from 'interactions/SetInput/directives/set-input-rules.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AlertsService } from 'services/alerts.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { State } from 'domain/state/StateObjectFactory';
import { ResponsesService } from '../services/responses.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';


const RULES_SERVICE_MAPPING = {
  AlgebraicExpressionInputRulesService: AlgebraicExpressionInputRulesService, 
  CodeReplRulesService: CodeReplRulesService, 
  ContinueRulesService: ContinueRulesService, 
  FractionInputRulesService: FractionInputRulesService, 
  ImageClickInputRulesService: ImageClickInputRulesService, 
  InteractiveMapRulesService: InteractiveMapRulesService, 
  MathEquationInputRulesService: MathEquationInputRulesService, 
  NumericExpressionInputRulesService: NumericExpressionInputRulesService, 
  NumericInputRulesService: NumericInputRulesService, 
  PencilCodeEditorRulesService: PencilCodeEditorRulesService, 
  GraphInputRulesService: GraphInputRulesService, 
  SetInputRulesService: SetInputRulesService, 
  TextInputRulesService: TextInputRulesService,
};

@Component({
  selector: 'training-data-editor-panel-service-modal',
  templateUrl: './training-data-editor.component.html'
})

export class TrainingDataEditorPanelServiceModalController
  extends ConfirmOrCancelModal implements OnInit {
  _stateName: string | null;
  stateName: string | null;
  _state: State;
  answerGroupIndex: number;
  FOCUS_LABEL_TEST_INTERACTION_INPUT: string;
  trainingData: any;
  stateContent: any;
  answerGroupHasNonEmptyRules: any;
  inputTemplate: any;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private windowRef: WindowRef,
    private injector: Injector,
    private alertsService: AlertsService,
    private trainingModalService: TrainingModalService,
    private stateInteractionIdService: StateInteractionIdService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private focusManagerService: FocusManagerService,
    private trainingDataService: TrainingDataService,
    private angularNameService: AngularNameService,
    private answerClassificationService: AnswerClassificationService,
    private explorationStatesService: ExplorationStatesService,
    private responsesService: ResponsesService,
    private stateEditorService: StateEditorService,
    private currentInteractionService: CurrentInteractionService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this._stateName = this.stateEditorService.getActiveStateName();
    this.stateName = this._stateName;
    this._state = this.explorationStatesService.getState(this._stateName);
    this.answerGroupIndex = (
      this.responsesService.getActiveAnswerGroupIndex());
    this.FOCUS_LABEL_TEST_INTERACTION_INPUT = 'testInteractionInput'

    this.stateContent = this._state.content.html;
    this.trainingData = [];
      this.answerGroupHasNonEmptyRules = (
        this.responsesService.getAnswerGroup(
          this.answerGroupIndex).rules.length > 0);
    this.inputTemplate = (
      this.explorationHtmlFormatterService.getInteractionHtml(
        this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento,
        false, this.FOCUS_LABEL_TEST_INTERACTION_INPUT, null));

    this.currentInteractionService.setOnSubmitFn(this.submitAnswer);
    this.init();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  openTrainUnresolvedAnswerModal(answerIndex: any): any {
    // An answer group must have either a rule or at least one
    // answer in training data. Don't allow modification of training
    // data answers if there are no rules and only one training data
    // answer is present.
    if ((this.answerGroupHasNonEmptyRules &&
        this.trainingData.length > 0) 
        this.trainingData.length > 1) {
      let answer = this.trainingData[answerIndex].answer;
      let interactionId = this.stateInteractionIdService.savedMemento;
      return this.trainingModalService.openTrainUnresolvedAnswerModal(
        answer, function() {
          let truncatedAnswer = $filter(
            'truncateInputBasedOnInteractionAnswerType')(
            answer, interactionId, 12);
          let successToast = (
            'The answer ' + truncatedAnswer +
            ' has been successfully trained.');
          this.alertsService.addSuccessMessage(
            successToast, 1000);
          this._rebuildTrainingData();
        });
    }
    return;
  }

  _rebuildTrainingData(): void {
    this.trainingData = [];
    this.trainingDataService.getTrainingDataOfAnswerGroup(
      this.answerGroupIndex).forEach((answer) => {
      let answerTemplate = (
        this.explorationHtmlFormatterService.getAnswerHtml(
          answer, this.stateInteractionIdService.savedMemento,
          this.stateCustomizationArgsService.savedMemento));
      this.trainingData.push({
        answer: answer,
        answerTemplate: answerTemplate
      });
    });
  }

  init(): void {
    this._rebuildTrainingData();
    this.newAnswerIsAlreadyResolved = false;
    this.answerSuccessfullyAdded = false;
    this.focusManagerService.setFocus(
      this.FOCUS_LABEL_TEST_INTERACTION_INPUT);
  }

  removeAnswerFromTrainingData(answerIndex: any): void {
    let answer = this.trainingData[answerIndex].answer;
    this.trainingDataService.removeAnswerFromAnswerGroupTrainingData(
      answer, answerGroupIndex);
    this.trainingData.splice(answerIndex, 1);
  }

  exit(): void {
    this.ngbActiveModal.close();
  }

  submitAnswe(newAnswer: any): void {
    this.newAnswerIsAlreadyResolved = false;

    let interactionId = this.stateInteractionIdService.savedMemento;

    let rulesServiceName =
      this.angularNameService.getNameOfInteractionRulesService(
        interactionId);

    // Inject RulesService dynamically.
    let rulesService = this.injector.get(RULES_SERVICE_MAPPING[rulesServiceName]);

    let newAnswerTemplate = (
      this.explorationHtmlFormatterService.getAnswerHtml(
        newAnswer, this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento));

    let classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        _stateName, _state.interaction, newAnswer, rulesService));
    let newAnswerOutcomeDest = classificationResult.outcome.dest;
    let newAnswerFeedback = classificationResult.outcome.feedback;
    if (newAnswerOutcomeDest === _stateName) {
      newAnswerOutcomeDest = '(try again)';
    }

    this.newAnswerTemplate = newAnswerTemplate;
    this.newAnswerFeedback = newAnswerFeedback;
    this.newAnswerOutcomeDest = newAnswerOutcomeDest;

    let classificationType = (
      classificationResult.classificationCategorization);

    // If answer is explicitly classified then show the
    // classification results to the creator.
    if (classificationType === EXPLICIT_CLASSIFICATION 
        classificationType === TRAINING_DATA_CLASSIFICATION) {
      this.newAnswerIsAlreadyResolved = true;
    } else {
      TrainingDataService.associateWithAnswerGroup(
        answerGroupIndex, newAnswer);
      let truncatedAnswer = $filter(
        'truncateInputBasedOnInteractionAnswerType')(
        newAnswer, interactionId, 12);
      let successToast = (
        'The answer ' + truncatedAnswer +
        ' has been successfully trained.');
      this.alertsService.addSuccessMessage(
        successToast, 1000);
      this._rebuildTrainingData();
    }
  };
}

angular.module('oppia').factory('trainingDataEditorPanelServiceModalController',
  downgradeComponent({
    component: TrainingDataEditorPanelServiceModalController
  }) as angular.IDirectiveFactory);
