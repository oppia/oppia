// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for creating a new collection node.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionUpdateService.ts');
require('domain/collection/SearchExplorationsBackendApiService.ts');
require('domain/summary/ExplorationSummaryBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require(
  'pages/collection-editor-page/services/collection-linearizer.service.ts');
require('services/AlertsService.ts');
require('services/SiteAnalyticsService.ts');
require('services/ValidatorsService.ts');

angular.module('oppia').directive('collectionNodeCreator', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/editor-tab/' +
        'collection-node-creator.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$window', '$filter', 'AlertsService',
        'ValidatorsService', 'CollectionEditorStateService',
        'CollectionLinearizerService', 'CollectionUpdateService',
        'CollectionNodeObjectFactory', 'ExplorationSummaryBackendApiService',
        'SearchExplorationsBackendApiService', 'SiteAnalyticsService',
        'INVALID_NAME_CHARS',
        function(
            $http, $window, $filter, AlertsService,
            ValidatorsService, CollectionEditorStateService,
            CollectionLinearizerService, CollectionUpdateService,
            CollectionNodeObjectFactory, ExplorationSummaryBackendApiService,
            SearchExplorationsBackendApiService, SiteAnalyticsService,
            INVALID_NAME_CHARS) {
          var ctrl = this;
          ctrl.collection = CollectionEditorStateService.getCollection();
          ctrl.newExplorationId = '';
          ctrl.newExplorationTitle = '';
          ctrl.searchQueryHasError = false;

          var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';

          /**
           * Fetches a list of exploration metadata dicts from backend, given
           * a search query. It then extracts the title and id of the
           * exploration to prepare typeahead options.
           */
          ctrl.fetchTypeaheadResults = function(searchQuery) {
            if (isValidSearchQuery(searchQuery)) {
              ctrl.searchQueryHasError = false;
              return SearchExplorationsBackendApiService.fetchExplorations(
                searchQuery
              ).then(function(explorationMetadataBackendDict) {
                var options = [];
                explorationMetadataBackendDict.collection_node_metadata_list.
                  map(function(item) {
                    if (!ctrl.collection.containsCollectionNode(item.id)) {
                      options.push(item.title + ' (' + item.id + ')');
                    }
                  });
                return options;
              }, function() {
                AlertsService.addWarning(
                  'There was an error when searching for matching ' +
                  'explorations.');
              });
            } else {
              ctrl.searchQueryHasError = true;
            }
          };

          var isValidSearchQuery = function(searchQuery) {
            // Allow underscores because they are allowed in exploration IDs.
            var INVALID_SEARCH_CHARS = (
              INVALID_NAME_CHARS.filter(function(item) {
                return item !== '_';
              }));
            for (var i = 0; i < INVALID_SEARCH_CHARS.length; i++) {
              if (searchQuery.indexOf(INVALID_SEARCH_CHARS[i]) !== -1) {
                return false;
              }
            }
            return true;
          };

          var addExplorationToCollection = function(newExplorationId) {
            if (!newExplorationId) {
              AlertsService.addWarning('Cannot add an empty exploration ID.');
              return;
            }
            if (ctrl.collection.containsCollectionNode(newExplorationId)) {
              AlertsService.addWarning(
                'There is already an exploration in this collection ' +
                'with that id.');
              return;
            }

            ExplorationSummaryBackendApiService
              .loadPublicAndPrivateExplorationSummaries([newExplorationId])
              .then(function(summaries) {
                var summaryBackendObject = null;
                if (summaries.length !== 0 &&
                    summaries[0].id === newExplorationId) {
                  summaryBackendObject = summaries[0];
                }
                if (summaryBackendObject) {
                  CollectionLinearizerService.appendCollectionNode(
                    ctrl.collection, newExplorationId, summaryBackendObject);
                } else {
                  AlertsService.addWarning(
                    'That exploration does not exist or you do not have edit ' +
                    'access to it.');
                }
              }, function() {
                AlertsService.addWarning(
                  'There was an error while adding an exploration to the ' +
                  'collection.');
              });
          };

          var convertTypeaheadToExplorationId = function(typeaheadOption) {
            var matchResults = typeaheadOption.match(/\((.*?)\)$/);
            if (matchResults === null) {
              return typeaheadOption;
            }
            return matchResults[1];
          };

          // Creates a new exploration, then adds it to the collection.
          ctrl.createNewExploration = function() {
            var title = $filter('normalizeWhitespace')(
              ctrl.newExplorationTitle);

            if (!ValidatorsService.isValidExplorationTitle(title, true)) {
              return;
            }

            // Create a new exploration with the given title.
            $http.post('/contributehandler/create_new', {
              title: title
            }).then(function(response) {
              ctrl.newExplorationTitle = '';
              var newExplorationId = response.data.explorationId;

              SiteAnalyticsService
                .registerCreateNewExplorationInCollectionEvent(
                  newExplorationId);
              addExplorationToCollection(newExplorationId);
            });
          };

          // Checks whether the user has left a '#' at the end of their ID
          // by accident (which can happen if it's being copy/pasted from the
          // editor page.
          ctrl.isMalformedId = function(typedExplorationId) {
            return (
              typedExplorationId &&
              typedExplorationId.lastIndexOf('#') ===
              typedExplorationId.length - 1);
          };

          ctrl.addExploration = function() {
            addExplorationToCollection(convertTypeaheadToExplorationId(
              ctrl.newExplorationId));
            ctrl.newExplorationId = '';
          };
        }
      ]
    };
  }]);
