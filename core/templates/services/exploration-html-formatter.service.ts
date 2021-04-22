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

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ExtensionTagAssemblerService } from
  'services/extension-tag-assembler.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { InteractionCustomizationArgs } from
  'interactions/customization-args-defs';
import { Solution } from 'domain/exploration/SolutionObjectFactory';


// A service that provides a number of utility functions useful to both the
// editor and player.
@Injectable({
  providedIn: 'root'
})
export class ExplorationHtmlFormatterService {
  private readonly migratedInteractions: string[] = [
    'Continue',
    'FractionInput',
    'GraphInput',
    'ImageClickInput'
  ];

  constructor(
      private camelCaseToHyphens: CamelCaseToHyphensPipe,
      private extensionTagAssembler: ExtensionTagAssemblerService,
      private htmlEscaper: HtmlEscaperService
  ) {}
  /**
   * @param {string} interactionId - The interaction id.
   * @param {object} interactionCustomizationArgSpecs - The various
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
   * @param {Solution} savedSolution - The saved solution that the interaction
   * needs to be prefilled with.
   */
  getInteractionHtml(
      interactionId: string,
      interactionCustomizationArgs: InteractionCustomizationArgs,
      parentHasLastAnswerProperty: boolean,
      labelForFocusTarget: string,
      savedSolution: Solution | undefined): string {
    var htmlInteractionId = this.camelCaseToHyphens.transform(interactionId);
    var element = $('<oppia-interactive-' + htmlInteractionId + '>');

    element = (
      this.extensionTagAssembler.formatCustomizationArgAttrs(
        element, interactionCustomizationArgs));
    let tagEnd = '></oppia-interactive-' + htmlInteractionId + '>';
    let directiveOuterHtml = element.get(0).outerHTML.replace(tagEnd, '');
    let addSpace = true;
    const getLastAnswer = (): string => {
      let propValue = parentHasLastAnswerProperty ? 'lastAnswer' : 'null';
      if (this.migratedInteractions.indexOf(interactionId) >= 0) {
        return '[last-answer]="' + propValue + '"';
      } else {
        return 'last-answer="' + propValue + '"';
      }
    };
    if (savedSolution) {
      // TODO(#12292): Refactor this once all interactions have been migrated to
      // Angular 2+, such that we don't need to parse the string in the
      // interaction directives/components.
      if (addSpace) {
        directiveOuterHtml += ' ';
      }
      directiveOuterHtml += (
        'saved-solution="' + JSON.stringify(
          savedSolution.correctAnswer) + '" '
      );
      addSpace = false;
    }
    if (labelForFocusTarget) {
      if (addSpace) {
        directiveOuterHtml += ' ';
      }
      directiveOuterHtml += (
        'label-for-focus-target="' + labelForFocusTarget + '" ');
      addSpace = false;
    }
    if (addSpace) {
      directiveOuterHtml += ' ';
    }
    directiveOuterHtml += (
      getLastAnswer() +
      '></oppia-interactive-' + htmlInteractionId + '>');
    return directiveOuterHtml;
  }

  getAnswerHtml(
      answer: string, interactionId: string,
      interactionCustomizationArgs: InteractionCustomizationArgs): string {
    // TODO(sll): Get rid of this special case for multiple choice.
    var interactionChoices = null;

    if ('choices' in interactionCustomizationArgs) {
      interactionChoices = interactionCustomizationArgs.choices.value;
    }

    var el = $(
      '<oppia-response-' + this.camelCaseToHyphens.transform(
        interactionId) + '>');
    el.attr('answer', this.htmlEscaper.objToEscapedJson(answer));
    if (interactionChoices) {
      el.attr('choices', this.htmlEscaper.objToEscapedJson(
        interactionChoices));
    }
    return ($('<div>').append(el)).html();
  }

  getShortAnswerHtml(
      answer: InteractionAnswer, interactionId: string,
      interactionCustomizationArgs: InteractionCustomizationArgs): string {
    var interactionChoices = null;

    // TODO(sll): Get rid of this special case for multiple choice.
    if ('choices' in interactionCustomizationArgs) {
      interactionChoices = interactionCustomizationArgs.choices.value.map(
        choice => choice.html);
    }

    var el = $(
      '<oppia-short-response-' + this.camelCaseToHyphens.transform(
        interactionId) + '>');
    el.attr('answer', this.htmlEscaper.objToEscapedJson(answer));
    if (interactionChoices) {
      el.attr('choices', this.htmlEscaper.objToEscapedJson(
        interactionChoices));
    }
    return ($('<span>').append(el)).html();
  }
}

angular.module('oppia').factory(
  'ExplorationHtmlFormatterService',
  downgradeInjectable(ExplorationHtmlFormatterService));
