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

// A service that provides a number of utility functions useful to both the
// editor and player.
oppia.factory('ExplorationHtmlFormatterService', [
  '$filter', 'extensionTagAssemblerService', 'HtmlEscaperService',
  function($filter, extensionTagAssemblerService, HtmlEscaperService) {
    return {
      getInteractionHtml: function(
          interactionId, interactionCustomizationArgSpecs,
          labelForFocusTarget) {
        var htmlInteractionId = $filter('camelCaseToHyphens')(interactionId);
        var element = $('<oppia-interactive-' + htmlInteractionId + '>');

        element = (
          extensionTagAssemblerService.formatCustomizationArgAttrs(
            element, interactionCustomizationArgSpecs));
        element.attr('on-submit', 'submitAnswer(answer, rulesService);');
        if (labelForFocusTarget) {
          element.attr('label-for-focus-target', labelForFocusTarget);
        }

        return element.get(0).outerHTML;
      },

      getAnswerHtml: function(
          answer, interactionId, interactionCustomizationArgs) {
        // TODO(sll): Get rid of this special case for multiple choice.
        var interactionChoices = null;
        if (interactionCustomizationArgs.choices) {
          interactionChoices = interactionCustomizationArgs.choices.value;
        }

        var el = $(
          '<oppia-response-' + $filter('camelCaseToHyphens')(
            interactionId) + '>');
        el.attr('answer', HtmlEscaperService.objToEscapedJson(answer));
        if (interactionChoices) {
          el.attr('choices', HtmlEscaperService.objToEscapedJson(
            interactionChoices));
        }
        return ($('<div>').append(el)).html();
      },

      getShortAnswerHtml: function(
        answer, interactionId, interactionCustomizationArgs) {
        // TODO(sll): Get rid of this special case for multiple choice.
        var interactionChoices = null;
        if (interactionCustomizationArgs.choices) {
          interactionChoices = interactionCustomizationArgs.choices.value;
        }

        var el = $(
          '<oppia-short-response-' + $filter('camelCaseToHyphens')(
            interactionId) + '>');
        el.attr('answer', HtmlEscaperService.objToEscapedJson(answer));
        if (interactionChoices) {
          el.attr('choices', HtmlEscaperService.objToEscapedJson(
            interactionChoices));
        }
        return ($('<span>').append(el)).html();
      }
    };
  }
]);
