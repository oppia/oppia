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
 * @fileoverview Directive for the Link rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('services/context.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaNoninteractiveLink', [
  'HtmlEscaperService',
  function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./link.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'ContextService',
        function($attrs, ContextService) {
          var ctrl = this;
          ctrl.$onInit = function() {
            var untrustedUrl = encodeURI(HtmlEscaperService.escapedJsonToObj(
              $attrs.urlWithValue));
            if (untrustedUrl.indexOf('http://') !== 0 &&
                untrustedUrl.indexOf('https://') !== 0) {
              untrustedUrl = 'https://' + untrustedUrl;
            }
            ctrl.url = untrustedUrl;

            ctrl.showUrlInTooltip = false;
            ctrl.text = ctrl.url;
            if ($attrs.textWithValue) {
              // This is done for backward-compatibility; some old explorations
              // have content parts that don't include a 'text' attribute on
              // their links.
              ctrl.text =
                HtmlEscaperService.escapedJsonToObj($attrs.textWithValue);
              // Note that this second 'if' condition is needed because a link
              // may have an empty 'text' value.
              if (ctrl.text) {
                ctrl.showUrlInTooltip = true;
              } else {
                ctrl.text = ctrl.url;
              }
            }

            // This following check disbales the link in Editor being caught
            // by tabbing while in Exploration Editor mode.
            if (ContextService.isInExplorationEditorMode()) {
              ctrl.tabIndexVal = -1;
            }
          };
        }]
    };
  }
]);
