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
import { ICustomizationArgs } from
  'domain/state/CustomizationArgsObjectFactory';

// A service that provides a number of utility functions useful to both the
// editor and player.
@Injectable({
  providedIn: 'root'
})
export class ExplorationHtmlFormatterService {
  constructor(
      private camelCaseToHyphensPipe: CamelCaseToHyphensPipe,
      private extensionTagAssemblerService: ExtensionTagAssemblerService,
      private htmlEscaperService: HtmlEscaperService) {}

  /**
   * @param interactionId - The interaction id.
   * @param interactionCustomizationArgSpecs - The various attributes that the
   *   interaction depends on.
   * @param parentHasLastAnswerProperty - If this function is called in the
   *   exploration_player view (including the preview mode), callers should
   *   ensure that parentHasLastAnswerProperty is set to true and
   *   $scope.lastAnswer = (
   *     PlayerTranscriptService.getLastAnswerOnDisplayedCard(index)) is set on
   *     the parent controller of the returned tag. Otherwise,
   *     parentHasLastAnswerProperty should be set to false.
   * @param labelForFocusTarget - The label for setting focus on the
   *   interaction.
   */
  getInteractionHtml(
      interactionId: string, interactionCustomizationArgSpecs: object,
      parentHasLastAnswerProperty: boolean,
      labelForFocusTarget: string): string {
    const htmlInteractionId = (
      this.camelCaseToHyphensPipe.transform(interactionId));
    const element = (
      this.extensionTagAssemblerService.formatCustomizationArgAttrs(
        $('<oppia-interactive-' + htmlInteractionId + '>'),
        interactionCustomizationArgSpecs));

    element.attr(
      'last-answer', parentHasLastAnswerProperty ? 'lastAnswer' : 'null');
    if (labelForFocusTarget) {
      element.attr('label-for-focus-target', labelForFocusTarget);
    }
    return element.get(0).outerHTML;
  }

  getAnswerHtml(
      answer: string, interactionId: string,
      interactionCustomizationArgs: ICustomizationArgs): string {
    // TODO(sll): Get rid of this special case for multiple choice.
    const choices = (
      interactionCustomizationArgs.choices ?
      interactionCustomizationArgs.choices.value : null);

    const el = $(
      '<oppia-response-' +
      this.camelCaseToHyphensPipe.transform(interactionId) + '>');
    el.attr('answer', this.htmlEscaperService.objToEscapedJson(answer));
    if (choices) {
      el.attr('choices', this.htmlEscaperService.objToEscapedJson(choices));
    }
    return $('<div>').append(el).html();
  }

  getShortAnswerHtml(
      answer: string, interactionId: string,
      interactionCustomizationArgs: ICustomizationArgs): string {
    // TODO(sll): Get rid of this special case for multiple choice.
    const choices = (
      interactionCustomizationArgs.choices ?
      interactionCustomizationArgs.choices.value : null);

    const el = $(
      '<oppia-short-response-' +
      this.camelCaseToHyphensPipe.transform(interactionId) + '>');
    el.attr('answer', this.htmlEscaperService.objToEscapedJson(answer));
    if (choices) {
      el.attr('choices', this.htmlEscaperService.objToEscapedJson(choices));
    }
    return $('<span>').append(el).html();
  }
}

angular.module('oppia').factory(
  'ExplorationHtmlFormatterService',
  downgradeInjectable(ExplorationHtmlFormatterService));
