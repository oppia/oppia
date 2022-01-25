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
 * @fileoverview Component for add or update solution modal.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ContextService } from 'services/context.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { Solution, SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

interface HtmlFormSchema {
  type: 'html';
  ui_config: object;
}

interface SolutionInterface {
  answerIsExclusive: boolean;
  correctAnswer: string;
  explanationHtml: string;
  explanationContentId: string;
  explanation?: string;
}

@Component({
  selector: 'oppia-add-or-update-solution-modal',
  templateUrl: './add-or-update-solution-modal.component.html'
})
export class AddOrUpdateSolutionModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  ansOptions: string[];
  answerIsValid: boolean;
  correctAnswerEditorHtml: string;
  data: SolutionInterface;
  savedMemento: InteractionAnswer;
  solutionType: Solution;
  tempAnsOption: string;
  COMPONENT_NAME_SOLUTION: string = (
    AppConstants.COMPONENT_NAME_SOLUTION);
  EMPTY_SOLUTION_DATA: SolutionInterface;
  SOLUTION_EDITOR_FOCUS_LABEL: string = (
    'currentCorrectAnswerEditorHtmlForSolutionEditor');
  EXPLANATION_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: (
        this.contextService.getEntityType() === 'question')
    }
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private ngbActiveModal: NgbActiveModal,
    private solutionObjectFactory: SolutionObjectFactory,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService
  ) {
    super(ngbActiveModal);
  }

  onSubmitFromSubmitButton(): void {
    this.currentInteractionService.submitAnswer();
  }

  shouldAdditionalSubmitButtonBeShown(): boolean {
    let interactionSpecs = INTERACTION_SPECS[
      this.stateInteractionIdService.savedMemento];
    return interactionSpecs.show_generic_submit_button;
  }

  isSolutionExplanationLengthExceeded(
      solExplanation: string): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return Boolean(solExplanation.length > 3000);
  }

  // Remove this function once the schema based editor
  // is migrated to Angular 8+.
  getSchema(): HtmlFormSchema {
    return this.EXPLANATION_FORM_SCHEMA;
  }

  onAnswerChange(): void {
    if (this.tempAnsOption === this.ansOptions[0]) {
      this.data.answerIsExclusive = true;
    } else {
      this.data.answerIsExclusive = false;
    }
  }

  updateLocalHtml($event: string): void {
    if (this.data.explanationHtml !== $event) {
      this.data.explanationHtml = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  isSubmitButtonDisabled(): boolean {
    return this.currentInteractionService.isSubmitButtonDisabled();
  }

  saveSolution(): void {
    if (typeof this.data.answerIsExclusive === 'boolean' &&
       this.data.correctAnswer !== null &&
        this.data.explanation !== '') {
      this.ngbActiveModal.close({
        solution: this.solutionObjectFactory.createNew(
          this.data.answerIsExclusive,
          this.data.correctAnswer,
          this.data.explanationHtml,
          this.data.explanationContentId)
      });
    } else {
      throw new Error('Cannot save invalid solution');
    }
  }

  ngOnInit(): void {
    this.solutionType = this.stateSolutionService.savedMemento;
    this.savedMemento = (
      this.stateSolutionService.savedMemento?.correctAnswer);
    this.correctAnswerEditorHtml = (
      this.explorationHtmlFormatterService.getInteractionHtml(
        this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento,
        false,
        this.SOLUTION_EDITOR_FOCUS_LABEL,
        this.savedMemento ? 'savedMemento()' : null)
    );
    this.answerIsValid = false;
    this.EMPTY_SOLUTION_DATA = {
      answerIsExclusive: false,
      correctAnswer: null,
      explanationHtml: '',
      explanationContentId: this.COMPONENT_NAME_SOLUTION
    };
    this.data = this.solutionType ? {
      answerIsExclusive: (
        this.stateSolutionService.savedMemento.answerIsExclusive),
      correctAnswer: null,
      explanationHtml: (
        this.stateSolutionService.savedMemento.explanation.html),
      explanationContentId: (
        this.stateSolutionService.savedMemento.explanation
          .contentId)
    } : cloneDeep(this.EMPTY_SOLUTION_DATA);
    this.currentInteractionService.setOnSubmitFn((answer) => {
      this.data.correctAnswer = answer;
    });
    this.ansOptions = ['The only', 'One'];
    this.tempAnsOption = this.ansOptions[1];
  }
}
