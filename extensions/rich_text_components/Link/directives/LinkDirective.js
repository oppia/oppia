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
 * Directive for the Link rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaNoninteractiveLink', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Link/directives/link_directive.html'),
      controller: [
        '$scope', '$attrs', 'ExplorationContextService',
        function($scope, $attrs, ExplorationContextService) {
          var untrustedUrl = encodeURI(HtmlEscaperService.escapedJsonToObj(
            $attrs.urlWithValue));
          if (untrustedUrl.indexOf('http://') !== 0 &&
              untrustedUrl.indexOf('https://') !== 0) {
            untrustedUrl = 'https://' + untrustedUrl;
          }
          $scope.url = untrustedUrl;

          $scope.showUrlInTooltip = false;
          $scope.text = $scope.url;
          if ($attrs.textWithValue) {
            // This is done for backward-compatibility; some old explorations
            // have content parts that don't include a 'text' attribute on
            // their links.
            $scope.text =
              HtmlEscaperService.escapedJsonToObj($attrs.textWithValue);
            // Note that this second 'if' condition is needed because a link may
            // have an empty 'text' value.
            if ($scope.text) {
              $scope.showUrlInTooltip = true;
            } else {
              $scope.text = $scope.url;
            }
          }

          // This following check disbales the link in Editor being caught
          // by tabbing while in Exploration Editor mode.
          if (ExplorationContextService.isInExplorationEditorMode()) {
            $scope.tabIndexVal = -1;
          }
        }]
    };
  }
]);
