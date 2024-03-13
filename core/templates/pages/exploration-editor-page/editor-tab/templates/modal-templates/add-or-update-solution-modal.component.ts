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

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ContextService} from 'services/context.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {StateSolutionService} from 'components/state-editor/state-editor-properties-services/state-solution.service';
import {
  Solution,
  SolutionObjectFactory,
} from 'domain/exploration/SolutionObjectFactory';
import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {
  CALCULATION_TYPE_CHARACTER,
  HtmlLengthService,
} from 'services/html-length.service';

interface HtmlFormSchema {
  type: 'html';
  ui_config: object;
}

interface SolutionInterface {
  answerIsExclusive: boolean;
  // This property will be undefined when the component is initialised
  // and correct answer is not yet choosen.
  correctAnswer: InteractionAnswer | undefined;
  explanationHtml: string;
  // A null 'explanationContentId' indicates that the 'Solution' has been
  // created but not saved. Before the 'SubtitledHtml' object is saved into a
  // State, the 'content_id' should be set to a string.
  explanationContentId: string | null;
  explanation?: string;
}

@Component({
  selector: 'oppia-add-or-update-solution-modal',
  templateUrl: './add-or-update-solution-modal.component.html',
})
export class AddOrUpdateSolutionModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  ansOptions!: string[];
  answerIsValid!: boolean;
  correctAnswerEditorHtml!: string;
  data!: SolutionInterface;
  // These properties are null until a solution is specified or removed.
  savedSolution!: InteractionAnswer | null;
  solutionType!: Solution | null;
  tempAnsOption!: string;
  COMPONENT_NAME_SOLUTION: string = AppConstants.COMPONENT_NAME_SOLUTION;

  SOLUTION_EDITOR_FOCUS_LABEL: string =
    'currentCorrectAnswerEditorHtmlForSolutionEditor';

  EXPLANATION_FORM_SCHEMA: HtmlFormSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions:
        this.contextService.getEntityType() === 'question',
    },
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private generateContentIdService: GenerateContentIdService,
    private ngbActiveModal: NgbActiveModal,
    private solutionObjectFactory: SolutionObjectFactory,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService,
    private htmlLengthService: HtmlLengthService
  ) {
    super(ngbActiveModal);
  }

  onSubmitFromSubmitButton(): void {
    this.currentInteractionService.submitAnswer();
  }

  shouldAdditionalSubmitButtonBeShown(): boolean {
    let interactionId = this.stateInteractionIdService
      .savedMemento as InteractionSpecsKey;
    const interactionSpec =
      InteractionSpecsConstants.INTERACTION_SPECS[interactionId];
    return interactionSpec.show_generic_submit_button;
  }

  isSolutionExplanationLengthExceeded(solExplanation: string): boolean {
    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        solExplanation,
        CALCULATION_TYPE_CHARACTER
      ) > 3000
    );
  }

  onAnswerChange(): void {
    this.data.answerIsExclusive = this.tempAnsOption === this.ansOptions[0];
  }

  isSubmitButtonDisabled(): boolean {
    return this.currentInteractionService.isSubmitButtonDisabled();
  }

  saveSolution(): void {
    if (
      typeof this.data.answerIsExclusive === 'boolean' &&
      this.data.correctAnswer !== undefined &&
      this.data.explanation !== '' &&
      this.data.explanationContentId !== null
    ) {
      this.ngbActiveModal.close({
        solution: this.solutionObjectFactory.createNew(
          this.data.answerIsExclusive,
          this.data.correctAnswer,
          this.data.explanationHtml,
          this.data.explanationContentId
        ),
      });
    } else {
      throw new Error('Cannot save invalid solution');
    }
  }

  ngOnInit(): void {
    this.solutionType = this.stateSolutionService.savedMemento;
    if (this.solutionType) {
      this.savedSolution = this.solutionType.correctAnswer;
    } else {
      this.savedSolution = null;
    }
    this.correctAnswerEditorHtml =
      this.explorationHtmlFormatterService.getInteractionHtml(
        this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento,
        false,
        this.SOLUTION_EDITOR_FOCUS_LABEL,
        this.savedSolution ? 'savedSolution' : null
      );
    this.answerIsValid = false;
    if (this.solutionType) {
      this.data = {
        answerIsExclusive: this.solutionType.answerIsExclusive,
        correctAnswer: undefined,
        explanationHtml: this.solutionType.explanation.html,
        explanationContentId: this.solutionType.explanation.contentId,
      };
    } else {
      this.data = {
        answerIsExclusive: false,
        correctAnswer: undefined,
        explanationHtml: '',
        explanationContentId: this.generateContentIdService.getNextStateId(
          this.COMPONENT_NAME_SOLUTION
        ),
      };
    }
    this.currentInteractionService.setOnSubmitFn(
      (answer: InteractionAnswer) => {
        this.data.correctAnswer = answer;
      }
    );
    this.ansOptions = ['The only', 'One'];
    this.tempAnsOption = this.ansOptions[1];
  }
}
