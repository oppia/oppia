// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Answer Submit Learner Action.
 */

require('services/exploration-html-formatter.service.ts');
require('services/html-escaper.service.ts');
require('domain/exploration/InteractionObjectFactory.ts');

angular.module('oppia').component('answerSubmitAction', {
  template: require('./answer-submit-action.component.html'),
  controller: ['$attrs', 'ExplorationHtmlFormatterService',
    'HtmlEscaperService', 'InteractionObjectFactory',
    function(
        $attrs, ExplorationHtmlFormatterService,
        HtmlEscaperService, InteractionObjectFactory) {
      var ctrl = this;
      var _customizationArgs = (
        InteractionObjectFactory.convertFromCustomizationArgsBackendDict(
          $attrs.interactionId,
          HtmlEscaperService.escapedJsonToObj(
            $attrs.interactionCustomizationArgs)
        )
      );
      var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
      ctrl.getShortAnswerHtml = function() {
        return ExplorationHtmlFormatterService.getShortAnswerHtml(
          _answer, $attrs.interactionId, _customizationArgs);
      };
      ctrl.$onInit = function() {
        ctrl.currentStateName = $attrs.currentStateName;
        ctrl.destStateName = $attrs.destStateName;
        ctrl.actionIndex = $attrs.actionIndex;
        ctrl.timeSpentInStateSecs = $attrs.timeSpentInStateSecs;
      };
    }]
});
