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
 * @fileoverview Component for Training Modal.
 */


import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ResponsesService } from '../services/responses.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AnswerGroup, AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { AngularNameService } from 'pages/exploration-editor-page/services/angular-name.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { ExplorationWarningsService } from 'pages/exploration-editor-page/services/exploration-warnings.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { TrainingDataService } from './training-data.service';
import cloneDeep from 'lodash/cloneDeep';
import { InteractionAnswer } from 'interactions/answer-defs';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
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

interface classification {
  answerGroupIndex: number;
  newOutcome: Outcome;
}

@Component({
  selector: 'oppia-training-modal',
  templateUrl: './training-modal.component.html'
})
export class TrainingModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() unhandledAnswer: InteractionAnswer;
  @Output() finishTrainingCallback: EventEmitter<void> =
    new EventEmitter();

  trainingDataAnswer: InteractionAnswer | string = '';
  // See the training panel directive in ExplorationEditorTab for an
  // explanation on the structure of this object.
  classification: classification;
  addingNewResponse: boolean = false;

  constructor(
    private injector: Injector,
    private ngbActiveModal: NgbActiveModal,
    private responsesService: ResponsesService,
    private explorationStatesService: ExplorationStatesService,
    private stateEditorService: StateEditorService,
    private graphDataService: GraphDataService,
    private explorationWarningsService: ExplorationWarningsService,
    private answerGroupObjectFactory: AnswerGroupObjectFactory,
    private trainingDataService: TrainingDataService,
    private angularNameService: AngularNameService,
    private answerClassificationService: AnswerClassificationService,
    private stateInteractionIdService: StateInteractionIdService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.classification = {
      answerGroupIndex: 0,
      newOutcome: null
    };
    this.addingNewResponse = false;

    this.init();
  }

  _saveNewAnswerGroup(newAnswerGroup: AnswerGroup): void {
    let answerGroups = this.responsesService.getAnswerGroups();
    answerGroups.push(newAnswerGroup);

    this.responsesService.save(
      answerGroups, this.responsesService.getDefaultOutcome(),
      (newAnswerGroups, newDefaultOutcome) => {
        this.explorationStatesService.saveInteractionAnswerGroups(
          this.stateEditorService.getActiveStateName(),
          cloneDeep(newAnswerGroups));

        this.explorationStatesService.saveInteractionDefaultOutcome(
          this.stateEditorService.getActiveStateName(),
          cloneDeep(newDefaultOutcome));

        this.graphDataService.recompute();
        this.explorationWarningsService.updateWarnings();
      });
  }

  exitTrainer(): void {
    this.ngbActiveModal.close();
  }

  onConfirm(): void {
    let index = this.classification.answerGroupIndex;
    if (index > this.responsesService.getAnswerGroupCount()) {
      let newOutcome = this.classification.newOutcome;
      let newAnswerGroup = this.answerGroupObjectFactory.createNew(
        [], cloneDeep(newOutcome), [this.unhandledAnswer], null);
      this._saveNewAnswerGroup(newAnswerGroup);
      this.trainingDataService.associateWithAnswerGroup(
        this.responsesService.getAnswerGroupCount() - 1,
        this.unhandledAnswer);
    } else if (index === this.responsesService.getAnswerGroupCount()) {
      this.trainingDataService.associateWithDefaultResponse(
        this.unhandledAnswer);
    } else {
      this.trainingDataService.associateWithAnswerGroup(
        index, this.unhandledAnswer);
    }

    this.finishTrainingCallback.emit();
    this.ngbActiveModal.close();
  }

  init(): void {
    let currentStateName =
      this.stateEditorService.getActiveStateName();
    let state = this.explorationStatesService.getState(currentStateName);

    // Retrieve the interaction ID.
    let interactionId = this.stateInteractionIdService.savedMemento;

    let rulesServiceName =
      this.angularNameService.getNameOfInteractionRulesService(
        interactionId);

    // Inject RulesService dynamically.
    let rulesService = (
      this.injector.get(RULES_SERVICE_MAPPING[rulesServiceName]));

    let classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        currentStateName, state.interaction, this.unhandledAnswer,
        rulesService));

    // This.trainingDataAnswer, this.trainingDataFeedback
    // this.trainingDataOutcomeDest are intended to be local
    // to this modal and should not be used to populate any
    // information in the active exploration (including the
    // feedback). The feedback here refers to a representation
    // of the outcome of an answer group, rather than the
    // specific feedback of the outcome (for instance, it
    // includes the destination state within the feedback).
    this.trainingDataAnswer = this.unhandledAnswer;
    this.classification.answerGroupIndex = (
      classificationResult.answerGroupIndex);
    this.classification.newOutcome = classificationResult.outcome;
  }
}

angular.module('oppia').directive('oppiaTrainingModal',
  downgradeComponent({
    component: TrainingModalComponent
  }) as angular.IDirectiveFactory);
