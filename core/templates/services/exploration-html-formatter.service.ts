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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { CamelCaseToHyphensPipe } from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ExtensionTagAssemblerService } from 'services/extension-tag-assembler.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';

// A service that provides a number of utility functions useful to both the
// editor and player.
@Injectable({
  providedIn: 'root'
})
export class ExplorationHtmlFormatterService {
  private readonly migratedInteractions: string[] = [
    'AlgebraicExpressionInput',
    'CodeRepl',
    'Continue',
    'DragAndDropSortInput',
    'EndExploration',
    'FractionInput',
    'GraphInput',
    'ImageClickInput',
    'InteractiveMap',
    'MathEquationInput',
    'MultipleChoiceInput',
    'NumberWithUnits',
    'ItemSelectionInput',
    'MusicNotesInput',
    'NumericExpressionInput',
    'NumericInput',
    'PencilCodeEditor',
    'RatioExpressionInput',
    'SetInput',
    'TextInput',
  ];

  constructor(
      private camelCaseToHyphens: CamelCaseToHyphensPipe,
      private extensionTagAssembler: ExtensionTagAssemblerService,
      private htmlEscaper: HtmlEscaperService
  ) {}

  /**
   * @param {string} interactionId - The interaction id.
   * @param {object} interactionCustomizationArgs - The various
   *   attributes that the interaction depends on.
   * @param {boolean} parentHasLastAnswerProperty - If this function is
   *   called in the exploration_player view (including the preview mode),
   *   callers should ensure that parentHasLastAnswerProperty is set to
   *   true and $scope.lastAnswer =
   *   PlayerTranscriptService.getLastAnswerOnDisplayedCard(index) is set on
   *   the parent controller of the returned tag.
   *   Otherwise, parentHasLastAnswerProperty should be set to false.
   * @param {string} labelForFocusTarget - The label for setting focus on
   *   the interaction.
   * @param {string} savedSolution - The name of property that needs to be bound
   *   containing the savedSolution in the scope. The scope here is the
   *   scope where the return value of this function is compiled.
   */
  getInteractionHtml(
      interactionId: string,
      interactionCustomizationArgs: InteractionCustomizationArgs,
      parentHasLastAnswerProperty: boolean,
      labelForFocusTarget: string | null,
      savedSolution: 'savedSolution' | null
  ): string {
    let availableInteractionIds = Array.prototype.concat.apply(
      [],
      AppConstants.ALLOWED_INTERACTION_CATEGORIES.map(
        category => category.interaction_ids
      )
    );
    if (!availableInteractionIds.includes(interactionId)) {
      throw new Error(`Invalid interaction id: ${interactionId}.`);
    }
    let htmlInteractionId = this.camelCaseToHyphens.transform(interactionId);
    // The createElement is safe because we verify that the interactionId
    // belongs to a list of interaction IDs.
    let element = document.createElement(
      `oppia-interactive-${htmlInteractionId}`);
    element = (
      this.extensionTagAssembler.formatCustomizationArgAttrs(
        element, interactionCustomizationArgs)
    );
    // The setAttribute is safe because we verify that the savedSolution
    // is 'savedMemento()'.
    if (savedSolution === 'savedSolution') {
      // TODO(#12292): Refactor this once all interactions have been migrated to
      // Angular 2+, such that we don't need to parse the string in the
      // interaction directives/components.
      element.setAttribute('saved-solution', savedSolution);
      // If interaction is migrated, we only check whether the attribute can be
      // added, since we cannot add it in proper Angular form using
      // 'setAttribute'. The rest is done below using string concatenation.
      if (this.migratedInteractions.indexOf(interactionId) >= 0) {
        element.removeAttribute('saved-solution');
      }
    } else if (savedSolution !== null) {
      throw new Error(`Unexpected saved solution: ${savedSolution}.`);
    }

    const alphanumericRegex = new RegExp('^[a-zA-Z0-9]+$');
    // The setAttribute is safe because we verify that the labelForFocusTarget
    // is only formed of alphanumeric characters.
    if (labelForFocusTarget && alphanumericRegex.test(labelForFocusTarget)) {
      element.setAttribute('label-for-focus-target', labelForFocusTarget);
    } else if (labelForFocusTarget) {
      throw new Error(
        `Unexpected label for focus target: ${labelForFocusTarget}.`);
    }

    let lastAnswerPropValue = (
      parentHasLastAnswerProperty ? 'lastAnswer' : 'null'
    );
    // The setAttribute is safe because the only possible value is 'lastAnswer'
    // as per the line above.
    element.setAttribute('last-answer', lastAnswerPropValue);
    // If interaction is migrated, we only check whether the attribute can be
    // added, since we cannot add it in proper Angular form using
    // 'setAttribute'. The rest is done below using string concatenation.
    if (this.migratedInteractions.indexOf(interactionId) >= 0) {
      element.removeAttribute('last-answer');
    }

    // TODO(#8472): Remove the following code after we migrate this part of
    // the codebase into the Angular 2+.
    // This is done because 'setAttribute' doesn't allow some characters to be
    // set as attribute keys (like '[' or ']'). So when interaction is migrated
    // we first test whether the other parts of the attribute can be added
    // (code above) and then we add the attribute using string concatenation.
    let interactionHtml = element.outerHTML;
    const tagEnd = '></oppia-interactive-' + htmlInteractionId + '>';
    let interactionHtmlWithoutEnd = interactionHtml.replace(tagEnd, '');
    if (savedSolution === 'savedSolution') {
      interactionHtmlWithoutEnd += ` [saved-solution]="${savedSolution}"`;
    }
    interactionHtmlWithoutEnd += ` [last-answer]="${lastAnswerPropValue}"`;
    return interactionHtmlWithoutEnd + tagEnd;
  }

  getAnswerHtml(
      answer: InteractionAnswer,
      interactionId: string | null,
      interactionCustomizationArgs: InteractionCustomizationArgs
  ): string {
    // TODO(#14464): Remove this check once interaction ID is
    // not allowed to be null.
    if (interactionId === null) {
      throw new Error('InteractionId cannot be null');
    }
    var element = document.createElement(
      `oppia-response-${this.camelCaseToHyphens.transform(interactionId)}`);
    element.setAttribute('answer', this.htmlEscaper.objToEscapedJson(answer));
    // TODO(sll): Get rid of this special case for multiple choice.
    if ('choices' in interactionCustomizationArgs) {
      let interactionChoices = interactionCustomizationArgs.choices.value;
      element.setAttribute(
        'choices', this.htmlEscaper.objToEscapedJson(interactionChoices));
    }
    return element.outerHTML;
  }

  getShortAnswerHtml(
      answer: InteractionAnswer,
      interactionId: string,
      interactionCustomizationArgs: InteractionCustomizationArgs
  ): string {
    let element = document.createElement(
      `oppia-short-response-${this.camelCaseToHyphens.transform(interactionId)}`
    );
    element.setAttribute('answer', this.htmlEscaper.objToEscapedJson(answer));
    // TODO(sll): Get rid of this special case for multiple choice.
    if ('choices' in interactionCustomizationArgs) {
      let interactionChoices = interactionCustomizationArgs.choices.value;
      element.setAttribute(
        'choices', this.htmlEscaper.objToEscapedJson(interactionChoices));
    }
    return element.outerHTML;
  }
}

angular.module('oppia').factory(
  'ExplorationHtmlFormatterService',
  downgradeInjectable(ExplorationHtmlFormatterService));
