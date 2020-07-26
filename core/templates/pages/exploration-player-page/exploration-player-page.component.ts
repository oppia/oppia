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
 * @fileoverview Component for the explaration player page.
 */
import 'mousetrap';

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.directive.ts');

require('interactions/interactionsRequires.ts');
require('objects/objectComponentsRequiresForPlayers.ts');

angular.module('oppia').component('explorationPlayerPage', {
  template: require('./exploration-player-page.component.html'),
  controller: [
    'ContextService', '$timeout', 'PageTitleService',
    'ReadOnlyExplorationBackendApiService',
    function(
        ContextService, $timeout, PageTitleService,
        ReadOnlyExplorationBackendApiService) {
      var ctrl = this;
      ctrl.$onInit = function() {
        var explorationId = ContextService.getExplorationId();
        ReadOnlyExplorationBackendApiService.fetchExploration(
          explorationId, null)
          .then(function(response) {
            PageTitleService.setPageTitle(
              response.exploration.title + ' - Oppia');
            angular.element('meta[itemprop="name"]').attr(
              'content', response.exploration.title);
            angular.element('meta[itemprop="description"]').attr(
              'content', response.exploration.objective);
            angular.element('meta[property="og:title"]').attr(
              'content', response.exploration.title);
            angular.element('meta[property="og:description"]').attr(
              'content', response.exploration.objective);
          });

        var bindExplorationPlayerShortcuts = function() {
          Mousetrap.bind('s', function() {
            document.getElementById('skipToMainContentId').focus();
            return false;
          });

          Mousetrap.bind('k', function() {
            var previousButton = document.getElementById('backButtonId');
            if (previousButton !== null) {
              previousButton.focus();
            }
            return false;
          });

          Mousetrap.bind('j', function() {
            var nextButton = <HTMLElement>document.querySelector(
              '.protractor-test-next-button');
            var continueButton1 = <HTMLElement>document.querySelector(
              '.protractor-test-continue-to-next-card-button');
            var continueButton2 = <HTMLElement>document.querySelector(
              '.protractor-test-continue-button');
            if (nextButton !== null) {
              nextButton.focus();
            }
            if (continueButton1 !== null) {
              continueButton1.focus();
            }
            if (continueButton2 !== null) {
              continueButton2.focus();
            }
            return false;
          });
        };
        bindExplorationPlayerShortcuts();
      };
    }
  ]
});
