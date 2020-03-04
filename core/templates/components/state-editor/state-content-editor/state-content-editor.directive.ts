// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state content editor.
 */

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/editability.service.ts');

angular.module('oppia').directive('stateContentEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      link: function(scope, element) {
        // This allows the scope to be retrievable during Karma unit testing.
        // See http://stackoverflow.com/a/29833832 for more details.
        element[0].getControllerScope = function() {
          return scope;
        };
      },
      scope: {
        getStateContentPlaceholder: '&stateContentPlaceholder',
        onSaveStateContent: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-content-editor/' +
        'state-content-editor.directive.html'),
      controller: [
        '$scope', 'EditabilityService', 'EditorFirstTimeEventsService',
        'StateContentService', 'StateEditorService',
        function(
            $scope, EditabilityService, EditorFirstTimeEventsService,
            StateContentService, StateEditorService) {
          var ctrl = this;
          $scope.isCardHeightLimitReached = function() {
            var shadowPreviewCard = $(
              '.oppia-shadow-preview-card .oppia-learner-view-card-top-section'
            );
            var height = shadowPreviewCard.height();
            return (height > 630);
          };

          $scope.hideCardHeightLimitWarning = function() {
            $scope.cardHeightLimitWarningIsShown = false;
          };

          var saveContent = function() {
            StateContentService.saveDisplayedValue();
            $scope.onSaveStateContent(StateContentService.displayed);
            $scope.contentEditorIsOpen = false;
          };

          $scope.openStateContentEditor = function() {
            if ($scope.isEditable()) {
              EditorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
              $scope.contentEditorIsOpen = true;
            }
          };

          $scope.onSaveContentButtonClicked = function() {
            EditorFirstTimeEventsService.registerFirstSaveContentEvent();
            var savedContent = StateContentService.savedMemento;
            var contentHasChanged = (
              savedContent.getHtml() !==
              StateContentService.displayed.getHtml());
            if (contentHasChanged) {
              var contentId = StateContentService.displayed.getContentId();
              $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired(contentId);
            }
            saveContent();
          };

          $scope.cancelEdit = function() {
            StateContentService.restoreFromMemento();
            $scope.contentEditorIsOpen = false;
          };
          ctrl.$onInit = function() {
            $scope.HTML_SCHEMA = {
              type: 'html'
            };
            $scope.contentId = null;
            $scope.StateContentService = StateContentService;
            if (StateContentService.displayed) {
              $scope.contentId = StateContentService.displayed.getContentId();
            }

            $scope.contentEditorIsOpen = false;
            $scope.isEditable = EditabilityService.isEditable;
            $scope.cardHeightLimitWarningIsShown = true;
            $scope.$on('externalSave', function() {
              if ($scope.contentEditorIsOpen) {
                saveContent();
              }
            });
            StateEditorService.updateStateContentEditorInitialised();
          };
        }
      ]
    };
  }
]);
