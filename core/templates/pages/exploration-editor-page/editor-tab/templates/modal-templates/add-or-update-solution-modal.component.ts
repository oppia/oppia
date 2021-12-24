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
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

interface HtmlFormSchema {
  type: 'html';
  'ui_config': object;
}

interface SolutionInterface {
  'answerIsExclusive': boolean,
  'correctAnswer': string,
  'explanationHtml': string,
  'explanationContentId': string,
  'explanation'?: string,
}

@Component({
  selector: 'oppia-add-or-update-solution-modal',
  templateUrl: './add-or-update-solution-modal.component.html'
})
export class AddOrUpdateSolutionModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  directiveSubscriptions: Subscription = new Subscription();
  answerIsValid: boolean;
  data: SolutionInterface;
  tempAnsOption: string;
  isSubmitButtonDisabled: boolean;
  COMPONENT_NAME_SOLUTION: string;
  EMPTY_SOLUTION_DATA: object;
  SOLUTION_EDITOR_FOCUS_LABEL: string = (
    'currentCorrectAnswerEditorHtmlForSolutionEditor');
  EXPLANATION_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
      ui_config: {
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
        }
    }

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
  
  savedMemento(): InteractionAnswer {
    return this.stateSolutionService.savedMemento?.correctAnswer;
  }

  correctAnswerEditorHtml = (
    this.explorationHtmlFormatterService.getInteractionHtml(
      this.stateInteractionIdService.savedMemento,
      this.stateCustomizationArgsService.savedMemento,
      false,
      this.SOLUTION_EDITOR_FOCUS_LABEL,
      this.savedMemento() ? 'savedMemento()' : null)
    )

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
      return Boolean(solExplanation.length > 3000);
  }

  getSchema(): HtmlFormSchema {
    return this.EXPLANATION_FORM_SCHEMA;
  }

  onAnswerChange(): void {
    if(this.tempAnsOption === 'The only'){
      this.data.answerIsExclusive = true;
    }
    else{
      this.data.answerIsExclusive = false;
    }
  }

  updateLocalHtml($event: string): void {
    if(this.data.explanationHtml !== $event){
      this.data.explanationHtml = $event;
    }
    this.changeDetectorRef.detectChanges();
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
  };

  ngOnInit(): void {
    if(this.savedMemento()){
      this.data.answerIsExclusive = (
        this.stateSolutionService.savedMemento.answerIsExclusive);
      this.data.explanationHtml = (
        this.stateSolutionService.savedMemento.explanation.html);
      this.data.explanationContentId = (
        this.stateSolutionService.savedMemento.explanation.contentId);
    }
    else {
      this.data.answerIsExclusive = false;
      this.data.explanationHtml = '';
      this.data.explanationContentId = this.COMPONENT_NAME_SOLUTION;
    }
    this.data.correctAnswer = null;
    this.answerIsValid = false;
    this.isSubmitButtonDisabled = (
      this.currentInteractionService.isSubmitButtonDisabled());
    this.currentInteractionService.setOnSubmitFn((answer: string) => {
        this.data.correctAnswer = answer;
    })
  }
}
