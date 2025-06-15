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
 * @fileoverview Component for TrainingDataEditorPanelComponent modal.
 */
import {Subscription} from 'rxjs';
import {Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants';
import {AngularNameService} from 'pages/exploration-editor-page/services/angular-name.service';
import {AlgebraicExpressionInputRulesService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import {CodeReplRulesService} from 'interactions/CodeRepl/directives/code-repl-rules.service';
import {ContinueRulesService} from 'interactions/Continue/directives/continue-rules.service';
import {FractionInputRulesService} from 'interactions/FractionInput/directives/fraction-input-rules.service';
import {GraphInputRulesService} from 'interactions/GraphInput/directives/graph-input-rules.service';
import {ImageClickInputRulesService} from 'interactions/ImageClickInput/directives/image-click-input-rules.service';
import {InteractiveMapRulesService} from 'interactions/InteractiveMap/directives/interactive-map-rules.service';
import {MathEquationInputRulesService} from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import {NumericExpressionInputRulesService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import {NumericInputRulesService} from 'interactions/NumericInput/directives/numeric-input-rules.service';
import {PencilCodeEditorRulesService} from 'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import {SetInputRulesService} from 'interactions/SetInput/directives/set-input-rules.service';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from 'pages/exploration-player-page/services/answer-classification.service';
import {AlertsService} from 'services/alerts.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {State} from 'domain/state/StateObjectFactory';
import {ResponsesService} from '../services/responses.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {TrainingDataService} from './training-data.service';
import {TrainingModalService} from './training-modal.service';
import {TruncateInputBasedOnInteractionAnswerTypePipe} from 'filters/truncate-input-based-on-interaction-answer-type.pipe';
import {InteractionAnswer} from 'interactions/answer-defs';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

export const RULES_SERVICE_MAPPING = {
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

interface TrainingData {
  answer: InteractionAnswer;
  answerTemplate: string;
}

@Component({
  selector: 'training-data-editor-panel',
  templateUrl: './training-data-editor-panel-modal.component.html',
})
export class TrainingDataEditorPanelComponent
  extends ConfirmOrCancelModal
  implements OnInit, OnDestroy
{
  directiveSubscriptions = new Subscription();

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  _state!: State;
  // State name is null if their is no state selected or have no active state.
  // This is the case when the user is creating a new state.
  _stateName!: string | null;
  stateName!: string | null;
  answerGroupIndex!: number;
  FOCUS_LABEL_TEST_INTERACTION_INPUT!: string;
  trainingData!: TrainingData[];
  stateContent!: string;
  answerGroupHasNonEmptyRules!: boolean;
  inputTemplate!: string;
  newAnswerIsAlreadyResolved!: boolean;
  answerSuccessfullyAdded!: boolean;
  newAnswerTemplate!: string;
  newAnswerFeedback!: SubtitledHtml;
  newAnswerOutcomeDest!: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
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
    private truncateInputBasedOnInteractionAnswerTypePipe: TruncateInputBasedOnInteractionAnswerTypePipe
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this._stateName = this.stateEditorService.getActiveStateName();
    this.stateName = this._stateName;
    if (!this._stateName) {
      throw new Error('State name cannot be empty.');
    }
    this._state = this.explorationStatesService.getState(this._stateName);
    this.answerGroupIndex = this.responsesService.getActiveAnswerGroupIndex();
    this.FOCUS_LABEL_TEST_INTERACTION_INPUT = 'testInteractionInput';
    this.stateContent = this._state.content.html;
    this.trainingData = [];
    this.answerGroupHasNonEmptyRules =
      this.responsesService.getAnswerGroup(this.answerGroupIndex).rules.length >
      0;
    this.inputTemplate =
      this.explorationHtmlFormatterService.getInteractionHtml(
        this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento,
        false,
        this.FOCUS_LABEL_TEST_INTERACTION_INPUT,
        null
      );

    this.directiveSubscriptions.add(
      this.trainingModalService.onFinishTrainingCallback.subscribe(
        finishTrainingResult => {
          let truncatedAnswer =
            this.truncateInputBasedOnInteractionAnswerTypePipe.transform(
              finishTrainingResult.answer,
              finishTrainingResult.interactionId,
              12
            );
          let successToast =
            'The answer ' + truncatedAnswer + ' has been successfully trained.';
          this.alertsService.addSuccessMessage(successToast, 1000);
          this._rebuildTrainingData();
        }
      )
    );

    this.currentInteractionService.setOnSubmitFn(this.submitAnswer);
    this.init();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  openTrainUnresolvedAnswerModal(answerIndex: number): void {
    // An answer group must have either a rule or at least one
    // answer in training data. Don't allow modification of training
    // data answers if there are no rules and only one training data
    // answer is present.

    if (
      this.answerGroupHasNonEmptyRules &&
      this.trainingData.length > 0 &&
      this.trainingData.length > 1
    ) {
      let answer = this.trainingData[answerIndex].answer;
      let interactionId = this.stateInteractionIdService.savedMemento;
      this.trainingModalService.openTrainUnresolvedAnswerModal(
        answer,
        interactionId,
        answerIndex
      );
    }
  }

  _rebuildTrainingData(): void {
    this.trainingData = [];
    this.trainingDataService
      .getTrainingDataOfAnswerGroup(this.answerGroupIndex)
      .forEach(answer => {
        let answerTemplate = this.explorationHtmlFormatterService.getAnswerHtml(
          answer,
          this.stateInteractionIdService.savedMemento,
          this.stateCustomizationArgsService.savedMemento
        );
        this.trainingData.push({
          answer: answer,
          answerTemplate: answerTemplate,
        });
      });
  }

  init(): void {
    this._rebuildTrainingData();
    this.newAnswerIsAlreadyResolved = false;
    this.answerSuccessfullyAdded = false;
    this.focusManagerService.setFocus(this.FOCUS_LABEL_TEST_INTERACTION_INPUT);
  }

  removeAnswerFromTrainingData(answerIndex: number): void {
    let answer = this.trainingData[answerIndex].answer;
    this.trainingDataService.removeAnswerFromAnswerGroupTrainingData(
      answer,
      this.answerGroupIndex
    );
    this.trainingData.splice(answerIndex, 1);
  }

  exit(): void {
    this.ngbActiveModal.close();
  }

  submitAnswer(newAnswer: InteractionAnswer): void {
    this.newAnswerIsAlreadyResolved = false;

    let interactionId = this.stateInteractionIdService.savedMemento;

    let rulesServiceName =
      this.angularNameService.getNameOfInteractionRulesService(interactionId);

    // Inject RulesService dynamically.
    let rulesService = this.injector.get(
      RULES_SERVICE_MAPPING[
        rulesServiceName as keyof typeof RULES_SERVICE_MAPPING
      ]
    ) as InteractionRulesService;

    let newAnswerTemplate = this.explorationHtmlFormatterService.getAnswerHtml(
      newAnswer,
      this.stateInteractionIdService.savedMemento,
      this.stateCustomizationArgsService.savedMemento
    );

    if (!this._stateName) {
      throw new Error('State name cannot be empty.');
    }
    let classificationResult =
      this.answerClassificationService.getMatchingClassificationResult(
        this._stateName,
        this._state.interaction,
        newAnswer,
        rulesService
      );
    let newAnswerOutcomeDest = classificationResult.outcome.dest;
    let newAnswerFeedback = classificationResult.outcome.feedback;
    if (newAnswerOutcomeDest === this._stateName) {
      newAnswerOutcomeDest = '(try again)';
    }

    this.newAnswerTemplate = newAnswerTemplate;
    this.newAnswerFeedback = newAnswerFeedback;
    this.newAnswerOutcomeDest = newAnswerOutcomeDest;

    let classificationType = classificationResult.classificationCategorization;

    if (
      classificationType ===
        ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION ||
      classificationType ===
        ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION
    ) {
      this.newAnswerIsAlreadyResolved = true;
    } else {
      this.trainingDataService.associateWithAnswerGroup(
        this.answerGroupIndex,
        newAnswer
      );
      let truncatedAnswer =
        this.truncateInputBasedOnInteractionAnswerTypePipe.transform(
          newAnswer,
          interactionId,
          12
        );
      let successToast =
        'The answer ' + truncatedAnswer + ' has been successfully trained.';
      this.alertsService.addSuccessMessage(successToast, 1000);
      this._rebuildTrainingData();
    }
  }
}
