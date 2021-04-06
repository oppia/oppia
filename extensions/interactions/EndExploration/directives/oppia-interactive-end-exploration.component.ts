// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the EndExploration 'interaction'.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/collection/read-only-collection-backend-api.service.ts');
require('services/context.service.ts');
require(
  'interactions/interaction-attributes-extractor.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').component('oppiaInteractiveEndExploration', {
  template: require('./end-exploration-interaction.component.html'),
  controllerAs: '$ctrl',
  controller: [
    '$attrs', '$http', 'ContextService',
    'InteractionAttributesExtractorService',
    'ReadOnlyCollectionBackendApiService', 'UrlService',
    'EXPLORATION_EDITOR_TAB_CONTEXT',
    'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', 'PAGE_CONTEXT',
    function(
        $attrs, $http, ContextService,
        InteractionAttributesExtractorService,
        ReadOnlyCollectionBackendApiService, UrlService,
        EXPLORATION_EDITOR_TAB_CONTEXT,
        EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, PAGE_CONTEXT) {
      var ctrl = this;
      ctrl.$onInit = function() {
        const {
          recommendedExplorationIds
        } = InteractionAttributesExtractorService.getValuesFromAttributes(
          'EndExploration',
          $attrs
        );
        var authorRecommendedExplorationIds = recommendedExplorationIds;

        ctrl.isIframed = UrlService.isIframed();
        ctrl.isInEditorPage = (
          ContextService.getPageContext() === (
            PAGE_CONTEXT.EXPLORATION_EDITOR));
        ctrl.isInEditorPreviewMode = ctrl.isInEditorPage && (
          ContextService.getEditorTabContext() ===
          EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW);
        ctrl.isInEditorMainTab = ctrl.isInEditorPage && (
          ContextService.getEditorTabContext() ===
          EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR);

        ctrl.collectionId = UrlService.getCollectionIdFromExplorationUrl();
        if (ctrl.collectionId) {
          ReadOnlyCollectionBackendApiService
            .loadCollectionAsync(ctrl.collectionId)
            .then(function(collection) {
              ctrl.getCollectionTitle = function() {
                return collection.getTitle();
              };
            });
        }

        ctrl.errorMessage = '';

        if (ctrl.isInEditorPage) {
          // Display a message if any author-recommended explorations are
          // invalid.
          $http.get(EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
            params: {
              stringified_exp_ids: JSON.stringify(
                authorRecommendedExplorationIds)
            }
          }).then(function(response) {
            var data = response.data;
            var foundExpIds = [];
            data.summaries.map(function(expSummary) {
              foundExpIds.push(expSummary.id);
            });

            var missingExpIds = [];
            authorRecommendedExplorationIds.forEach(function(expId) {
              if (foundExpIds.indexOf(expId) === -1) {
                missingExpIds.push(expId);
              }
            });

            if (missingExpIds.length === 0) {
              ctrl.errorMessage = '';
            } else {
              var listOfIds = missingExpIds.join('", "');
              ctrl.errorMessage = (
                'Warning: exploration(s) with the IDs "' + listOfIds +
                '" will not be shown as recommendations because ' +
                'they either do not exist, or are not publicly viewable.');
            }
          });
        }
      };
    }
  ]
});
