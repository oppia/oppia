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
 * @fileoverview Directive for the add and view hints section of the state
 * editor.
 */
oppia.directive('stateHintsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveHints: '=',
        onSaveSolution: '=',
        onSaveContentIdsToAudioTranslations: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state_editor/state_hints_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$filter',
        'GenerateContentIdService', 'AlertsService', 'INTERACTION_SPECS',
        'stateHintsService', 'COMPONENT_NAME_HINT',
        'stateContentIdsToAudioTranslationsService', 'EditabilityService',
        'stateInteractionIdService', 'UrlInterpolationService',
        'HintObjectFactory', 'stateSolutionService',
        function(
            $scope, $rootScope, $uibModal, $filter,
            GenerateContentIdService, AlertsService, INTERACTION_SPECS,
            stateHintsService, COMPONENT_NAME_HINT,
            stateContentIdsToAudioTranslationsService, EditabilityService,
            stateInteractionIdService, UrlInterpolationService,
            HintObjectFactory, stateSolutionService) {
          $scope.EditabilityService = EditabilityService;
          $scope.stateHintsService = stateHintsService;
          $scope.activeHintIndex = null;
          $scope.canEdit = GLOBALS.can_edit;

          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');

          $scope.$on('stateEditorInitialized', function(evt, stateData) {
            $scope.activeHintIndex = null;
          });

          $scope.getHintButtonText = function() {
            var hintButtonText = '+ Add Hint';
            if ($scope.stateHintsService.displayed) {
              if ($scope.stateHintsService.displayed.length >= 5) {
                hintButtonText = 'Limit Reached';
              }
            }
            return hintButtonText;
          };

          $scope.getHintSummary = function(hint) {
            var hintAsPlainText = $filter(
              'formatRtePreview')(hint.hintContent.getHtml());
            return hintAsPlainText;
          };

          $scope.changeActiveHintIndex = function(newIndex) {
            var currentActiveIndex = $scope.activeHintIndex;
            if (currentActiveIndex !== null && (
              !stateHintsService.displayed[currentActiveIndex]
                .hintContent.getHtml())) {
              if (stateSolutionService.savedMemento &&
                stateHintsService.displayed.length === 1) {
                openDeleteLastHintModal();
                return;
              } else {
                AlertsService.addInfoMessage('Deleting empty hint.');
                stateHintsService.displayed.splice(currentActiveIndex, 1);
                stateHintsService.saveDisplayedValue();
                $scope.onSaveHints(stateHintsService.displayed);
              }
            }
            // If the current hint is being clicked on again, close it.
            if (newIndex === $scope.activeHintIndex) {
              $scope.activeHintIndex = null;
            } else {
              $scope.activeHintIndex = newIndex;
            }
          };

          // This returns false if the current interaction ID is null.
          $scope.isCurrentInteractionLinear = function() {
            var interactionId = stateInteractionIdService.savedMemento;
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          $scope.openAddHintModal = function() {
            if ($scope.stateHintsService.displayed.length === 5) {
              return;
            }
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'add_hint_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.HINT_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.tmpHint = '';

                  $scope.addHintForm = {};

                  $scope.hintIndex = stateHintsService.displayed.length + 1;

                  $scope.saveHint = function() {
                    var contentId = GenerateContentIdService.getNextId(
                      COMPONENT_NAME_HINT);
                    // Close the modal and save it afterwards.
                    $uibModalInstance.close({
                      hint: angular.copy(
                        HintObjectFactory.createNew(contentId, $scope.tmpHint)),
                      contentId: contentId
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              stateHintsService.displayed.push(result.hint);
              stateContentIdsToAudioTranslationsService.displayed.addContentId(
                result.contentId);
              stateHintsService.saveDisplayedValue();
              $scope.onSaveHints(stateHintsService.displayed);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                stateContentIdsToAudioTranslationsService.displayed
              );
            });
          };

          // When the page is scrolled so that the top of the page is above the
          // browser viewport, there are some bugs in the positioning of the
          // helper. This is a bug in jQueryUI that has not been fixed yet. For
          // more details, see http://stackoverflow.com/q/5791886
          $scope.HINT_LIST_SORTABLE_OPTIONS = {
            axis: 'y',
            cursor: 'move',
            handle: '.oppia-hint-sort-handle',
            items: '.oppia-sortable-hint',
            revert: 100,
            tolerance: 'pointer',
            start: function(e, ui) {
              $rootScope.$broadcast('externalSave');
              $scope.activeHintIndex = null;
              ui.placeholder.height(ui.item.height());
            },
            stop: function() {
              stateHintsService.saveDisplayedValue();
              $scope.onSaveHints(stateHintsService.displayed);
            }
          };

          var openDeleteLastHintModal = function() {
            AlertsService.clearWarnings();

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'delete_last_hint_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.deleteBothSolutionAndHint = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {
              var solutionContentId = stateSolutionService.displayed
                .explanation.getContentId();
              stateSolutionService.displayed = null;
              stateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(stateSolutionService.displayed);

              var hintContentId = stateHintsService.displayed[0]
                .hintContent.getContentId();
              stateHintsService.displayed = [];
              stateHintsService.saveDisplayedValue();
              $scope.onSaveHints(stateHintsService.displayed);

              stateContentIdsToAudioTranslationsService.displayed
                .deleteContentId(solutionContentId);
              stateContentIdsToAudioTranslationsService.displayed
                .deleteContentId(hintContentId);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                stateContentIdsToAudioTranslationsService.displayed
              );
            });
          };

          $scope.deleteHint = function(index, evt) {
            // Prevent clicking on the delete button from also toggling the
            // display state of the hint.
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'delete_hint_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
                  $scope.reallyDelete = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {
              if (stateSolutionService.savedMemento &&
                stateHintsService.savedMemento.length === 1) {
                openDeleteLastHintModal();
              } else {
                var hintContentId = stateHintsService.displayed[index]
                  .hintContent.getContentId();
                stateHintsService.displayed.splice(index, 1);
                stateHintsService.saveDisplayedValue();
                $scope.onSaveHints(stateHintsService.displayed);
                stateContentIdsToAudioTranslationsService.displayed
                  .deleteContentId(hintContentId);
                stateContentIdsToAudioTranslationsService.saveDisplayedValue();
                $scope.onSaveContentIdsToAudioTranslations(
                  stateContentIdsToAudioTranslationsService.displayed
                );
              }
            });
          };

          $scope.onSaveInlineHint = function() {
            stateHintsService.saveDisplayedValue();
            $scope.onSaveHints(stateHintsService.displayed);
          };
        }
      ]
    };
  }]);
