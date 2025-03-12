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
 * @fileoverview Service to validate a question.
 *
 */

import {Injectable, Injector} from '@angular/core';

import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {Question} from 'domain/question/QuestionObjectFactory';
import {MisconceptionSkillMap} from 'domain/skill/MisconceptionObjectFactory';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';
import {AlgebraicExpressionInputValidationService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-validation.service';
import {CodeReplValidationService} from 'interactions/CodeRepl/directives/code-repl-validation.service';
import {ContinueValidationService} from 'interactions/Continue/directives/continue-validation.service';
import {DragAndDropSortInputValidationService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-validation.service';
import {EndExplorationValidationService} from 'interactions/EndExploration/directives/end-exploration-validation.service';
import {FractionInputValidationService} from 'interactions/FractionInput/directives/fraction-input-validation.service';
import {GraphInputValidationService} from 'interactions/GraphInput/directives/graph-input-validation.service';
import {ImageClickInputValidationService} from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import {InteractiveMapValidationService} from 'interactions/InteractiveMap/directives/interactive-map-validation.service';
import {ItemSelectionInputValidationService} from 'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
import {MathEquationInputValidationService} from 'interactions/MathEquationInput/directives/math-equation-input-validation.service';
import {MultipleChoiceInputValidationService} from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
import {MusicNotesInputValidationService} from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import {NumberWithUnitsValidationService} from 'interactions/NumberWithUnits/directives/number-with-units-validation.service';
import {NumericExpressionInputValidationService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-validation.service';
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {PencilCodeEditorValidationService} from 'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import {RatioExpressionInputValidationService} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import {SetInputValidationService} from 'interactions/SetInput/directives/set-input-validation.service';
import {TextInputValidationService} from 'interactions/TextInput/directives/text-input-validation.service';

const INTERACTION_SERVICE_MAPPING = {
  AlgebraicExpressionInputValidationService:
    AlgebraicExpressionInputValidationService,
  CodeReplValidationService: CodeReplValidationService,
  ContinueValidationService: ContinueValidationService,
  DragAndDropSortInputValidationService: DragAndDropSortInputValidationService,
  EndExplorationValidationService: EndExplorationValidationService,
  FractionInputValidationService: FractionInputValidationService,
  GraphInputValidationService: GraphInputValidationService,
  ImageClickInputValidationService: ImageClickInputValidationService,
  InteractiveMapValidationService: InteractiveMapValidationService,
  ItemSelectionInputValidationService: ItemSelectionInputValidationService,
  MathEquationInputValidationService: MathEquationInputValidationService,
  MultipleChoiceInputValidationService: MultipleChoiceInputValidationService,
  MusicNotesInputValidationService: MusicNotesInputValidationService,
  NumberWithUnitsValidationService: NumberWithUnitsValidationService,
  NumericExpressionInputValidationService:
    NumericExpressionInputValidationService,
  NumericInputValidationService: NumericInputValidationService,
  PencilCodeEditorValidationService: PencilCodeEditorValidationService,
  RatioExpressionInputValidationService: RatioExpressionInputValidationService,
  SetInputValidationService: SetInputValidationService,
  TextInputValidationService: TextInputValidationService,
};

@Injectable({
  providedIn: 'root',
})
export class QuestionValidationService {
  constructor(
    private responsesService: ResponsesService,
    private stateEditorService: StateEditorService,
    private injector: Injector
  ) {}

  isQuestionValid(
    question: Question | null | undefined,
    misconceptionsBySkill: MisconceptionSkillMap
  ): boolean {
    if (question === undefined || question === null) {
      return false;
    }

    return !(
      this.getValidationErrorMessage(question) ||
      question.getUnaddressedMisconceptionNames(misconceptionsBySkill).length >
        0 ||
      !this.stateEditorService.isCurrentSolutionValid()
    );
  }

  // Returns 'null' when the message is valid.
  getInteractionValidationErrorMessage(question: Question): string | null {
    const interaction = question.getStateData().interaction;
    const interactionId = interaction.id as InteractionSpecsKey;
    let validatorServiceName = interactionId + 'ValidationService';
    let validatorService = this.injector.get(
      INTERACTION_SERVICE_MAPPING[
        validatorServiceName as keyof typeof INTERACTION_SERVICE_MAPPING
      ]
    );
    let interactionValidationErrors = validatorService.getAllWarnings(
      null,
      interaction.customizationArgs,
      interaction.answerGroups,
      interaction.defaultOutcome
    );
    if (interactionValidationErrors.length > 0) {
      return interactionValidationErrors[0].message;
    }
    return null;
  }

  // Returns 'null' when the message is valid.
  getValidationErrorMessage(question: Question): string | null {
    const interaction = question.getStateData().interaction;
    const interactionId = interaction.id as InteractionSpecsKey;
    const questionContent = question.getStateData().content._html;
    if (questionContent.length === 0) {
      return 'Please enter a question.';
    }
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    let interactionValidationErrorMessage =
      this.getInteractionValidationErrorMessage(question);
    if (interactionValidationErrorMessage !== null) {
      return interactionValidationErrorMessage;
    }
    // Check if interaction answer choices have same number of answer groups.
    // for multiple choice and item selection. item selection logic seems
    // complicated. How to not duplicate?
    if (
      !this.responsesService.shouldHideDefaultAnswerGroup() &&
      interaction.defaultOutcome?.feedback._html.length === 0
    ) {
      return "Please enter feedback for the '[All other answers]' outcome.";
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specified';
    }
    if (
      !interaction.solution &&
      InteractionSpecsConstants.INTERACTION_SPECS[interactionId]
        .can_have_solution
    ) {
      return 'A solution must be specified';
    }
    const answerGroups = question.getStateData().interaction.answerGroups;
    let atLeastOneAnswerCorrect = false;
    for (const answerGroup of answerGroups) {
      if (answerGroup.outcome.labelledAsCorrect) {
        atLeastOneAnswerCorrect = true;
        continue;
      }
    }
    if (!atLeastOneAnswerCorrect) {
      return 'At least one answer should be marked correct';
    }
    return null;
  }
}
