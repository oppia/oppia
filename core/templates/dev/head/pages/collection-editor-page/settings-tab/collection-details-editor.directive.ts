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
 * @fileoverview Directive for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */

require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');

require('domain/collection/collection-update.service.ts');
require('domain/collection/collection-validation.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/collection-editor-page/collection-editor-page.directive.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').directive('collectionDetailsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/settings-tab/' +
        'collection-details-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'CollectionEditorStateService', 'CollectionUpdateService',
        'CollectionValidationService', 'AlertsService', 'ALL_CATEGORIES',
        'SUPPORTED_CONTENT_LANGUAGES', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
        'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
        'TAG_REGEX',
        function(
            $scope, CollectionEditorStateService, CollectionUpdateService,
            CollectionValidationService, AlertsService, ALL_CATEGORIES,
            SUPPORTED_CONTENT_LANGUAGES, COLLECTION_TITLE_INPUT_FOCUS_LABEL,
            EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED,
            TAG_REGEX) {
          var ctrl = this;
          var refreshSettingsTab = function() {
            ctrl.displayedCollectionTitle = ctrl.collection.getTitle();
            ctrl.displayedCollectionObjective = (
              ctrl.collection.getObjective());
            ctrl.displayedCollectionCategory = (
              ctrl.collection.getCategory());
            ctrl.displayedCollectionLanguage = (
              ctrl.collection.getLanguageCode());
            ctrl.displayedCollectionTags = (
              ctrl.collection.getTags());

            var categoryIsInSelect2 = ctrl.CATEGORY_LIST_FOR_SELECT2.some(
              function(categoryItem) {
                return categoryItem.id === ctrl.collection.getCategory();
              }
            );

            // If the current category is not in the dropdown, add it
            // as the first option.
            if (!categoryIsInSelect2 && ctrl.collection.getCategory()) {
              ctrl.CATEGORY_LIST_FOR_SELECT2.unshift({
                id: ctrl.collection.getCategory(),
                text: ctrl.collection.getCategory()
              });
            }
          };

          ctrl.updateCollectionTitle = function() {
            CollectionUpdateService.setCollectionTitle(
              ctrl.collection, ctrl.displayedCollectionTitle);
          };

          ctrl.updateCollectionObjective = function() {
            CollectionUpdateService.setCollectionObjective(
              ctrl.collection, ctrl.displayedCollectionObjective);
          };

          ctrl.updateCollectionCategory = function() {
            CollectionUpdateService.setCollectionCategory(
              ctrl.collection, ctrl.displayedCollectionCategory);
          };

          ctrl.updateCollectionLanguageCode = function() {
            CollectionUpdateService.setCollectionLanguageCode(
              ctrl.collection, ctrl.displayedCollectionLanguage);
          };

          // Normalize the tags for the collection
          var normalizeTags = function(tags) {
            for (var i = 0; i < tags.length; i++) {
              tags[i] = tags[i].trim().replace(/\s+/g, ' ');
            }
            return tags;
          };

          ctrl.updateCollectionTags = function() {
            ctrl.displayedCollectionTags = normalizeTags(
              ctrl.displayedCollectionTags);
            if (!CollectionValidationService.isTagValid(
              ctrl.displayedCollectionTags)) {
              AlertsService.addWarning(
                'Please ensure that there are no duplicate tags and that all ' +
                'tags contain only lower case and spaces.');
              return;
            }
            CollectionUpdateService.setCollectionTags(
              ctrl.collection, ctrl.displayedCollectionTags);
          };
          ctrl.hasPageLoaded = function() {
            return CollectionEditorStateService.hasLoadedCollection();
          };
          ctrl.$onInit = function() {
            $scope.$on(EVENT_COLLECTION_INITIALIZED, refreshSettingsTab);
            $scope.$on(EVENT_COLLECTION_REINITIALIZED, refreshSettingsTab);
            ctrl.collection = CollectionEditorStateService.getCollection();
            ctrl.COLLECTION_TITLE_INPUT_FOCUS_LABEL = (
              COLLECTION_TITLE_INPUT_FOCUS_LABEL);
            ctrl.CATEGORY_LIST_FOR_SELECT2 = ALL_CATEGORIES.map(
              function(category) {
                return {
                  id: category,
                  text: category
                };
              }
            );
            ctrl.languageListForSelect = SUPPORTED_CONTENT_LANGUAGES;
            ctrl.TAG_REGEX = TAG_REGEX;
          };
        }
      ]
    };
  }]);
