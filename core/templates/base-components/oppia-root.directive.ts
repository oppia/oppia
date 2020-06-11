// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The root directive of the oppia ajs application.
 */

// In case of doubts over what is done here, please look at the description of
// the PR #9479. https://github.com/oppia/oppia/pull/9479#issue-432536289

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
angular.module('oppia').directive('oppiaRoot', [
  function() {
    return {
      template: require('./oppia-root.directive.html'),
      scope: {},
      transclude: true,
      controllerAs: '$ctrl',
      controller: ['$scope',
        function($scope) {
          $scope.initialized = false;

          $scope.onInit = function() {
            /**
             * The angular.module('oppia').config(...) is added here to provide
             * the "angular instance" of service in angularjs using the regular
             * angularjs DI. We can choose not to have the following config.
             * But in that case, we would have to keep the upgraded-services.ts
             * because there is a lot of code dependent on it. Add the moment
             * this is not executing. Help is needed here!
             */
            angular.module('oppia').config(['$provide', function($provide) {
              /* eslint-disable max-len */
              var servicesToProvide = [
                'AlertsService', 'BackgroundMaskService', 'BrowserCheckerService',
                'CodeReplRulesService', 'CollectionCreationBackendService',
                'CollectionCreationBackendService',
                'ContextService', 'CreatorDashboardBackendApiService', 'CsrfTokenService',
                'DateTimeFormatService', 'DebouncerService', 'DeviceInfoService',
                'DocumentAttributeCustomizationService',
                'ExplorationHtmlFormatterService', 'ExplorationObjectFactory',
                'ExpressionParserService', 'ExtensionTagAssemblerService',
                'ExtractImageFilenamesFromStateService',
                'HtmlEscaperService', 'IdGenerationService', 'InteractionObjectFactory',
                'InteractionRulesRegistryService', 'LanguageUtilService',
                'LoaderService', 'LocalStorageService', 'LoggerService',
                'MetaTagCustomizationService', 'NormalizeWhitespacePipe',
                'NormalizeWhitespacePunctuationAndCasePipe', 'PageTitleService',
                'PencilCodeEditorRulesService', 'ProfilePageBackendApiService',
                'RatingComputationService',
                'SchemaDefaultValueService', 'SchemaUndefinedLastElementService',
                'SidebarStatusService', 'SiteAnalyticsService', 'SkillObjectFactory',
                'SolutionObjectFactory', 'StateCardObjectFactory',
                'StateImprovementSuggestionService', 'StateInteractionStatsService',
                'StateObjectFactory', 'StatesObjectFactory', 'SuggestionsService',
                'SuggestionThreadObjectFactory', 'TextInputRulesService',
                'ThreadMessageObjectFactory', 'ThreadMessageSummaryObjectFactory',
                'ThreadStatusDisplayService', 'TranslationLanguageService',
                'UrlInterpolationService', 'UrlService', 'UserInfoObjectFactory',
                'UtilsService', 'ValidatorsService', 'WindowDimensionsService',
                'WindowRef'];
              /* eslint-enable max-len */
              for (let service of servicesToProvide) {
                $provide.value(service, OppiaAngularRootComponent[(
                  service[0].toLowerCase() + service.substring(1))]);
              }
            }]);

            // The next line allows the transcluded content to start executing.
            $scope.initialized = true;
          };
        }]
    };
  }
]);
