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
 * @fileoverview Dependencies for the explaration player page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'pages/exploration-player-page/learner-experience/' +
  'conversation-skin.directive.ts');

require('interactions/interactionsRequires.ts');
require('objects/objectComponentsRequiresForPlayers.ts');

require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('services/context.service.ts');
require('services/page-title.service.ts');

angular.module('oppia').directive('explorationPlayerPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-player-page/' +
        'exploration-player-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'ContextService', 'PageTitleService',
        'ReadOnlyExplorationBackendApiService',
        function(
            ContextService, PageTitleService,
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
          };
        }
      ]
    };
  }]);
