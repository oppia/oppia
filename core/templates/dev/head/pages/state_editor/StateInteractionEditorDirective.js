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
 * @fileoverview Directive for the interaction editor section in the state
 * editor.
 */
oppia.directive('stateInteractionEditor', [
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
        onSaveInteractionCustomizationArgs: '=',
        onSaveInteractionId: '=',
        onSaveSolution: '=',
        onSaveStateContent: '=',
        recomputeGraph: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state_editor/state_interaction_editor_directive.html'),
      controller: [
        '$scope', '$http', '$rootScope', '$uibModal', '$injector', '$filter',
        'AlertsService', 'HtmlEscaperService', 'StateEditorService',
        'INTERACTION_SPECS', 'StateInteractionIdService',
        'StateCustomizationArgsService', 'EditabilityService',
        'InteractionDetailsCacheService', 'UrlInterpolationService',
        'ExplorationHtmlFormatterService', 'SubtitledHtmlObjectFactory',
        'StateSolutionService', 'StateHintsService',
        'StateContentService', function(
            $scope, $http, $rootScope, $uibModal, $injector, $filter,
            AlertsService, HtmlEscaperService, StateEditorService,
            INTERACTION_SPECS, StateInteractionIdService,
            StateCustomizationArgsService, EditabilityService,
            InteractionDetailsCacheService, UrlInterpolationService,
            ExplorationHtmlFormatterService, SubtitledHtmlObjectFactory,
            StateSolutionService, StateHintsService,
            StateContentService) {
          var DEFAULT_TERMINAL_STATE_CONTENT =
            'Congratulations, you have finished!';

          // Declare dummy submitAnswer() and adjustPageHeight() methods for the
          // interaction preview.
          $scope.submitAnswer = function() {};
          $scope.adjustPageHeight = function() {};
          $scope.EditabilityService = EditabilityService;

          $scope.StateInteractionIdService = StateInteractionIdService;
          $scope.hasLoaded = false;
          $scope.customizationModalReopened = false;

          $scope.userBlueImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png');
          $scope.userBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_black_72px.png');

          $scope.getCurrentInteractionName = function() {
            return (
              StateInteractionIdService.savedMemento ?
                INTERACTION_SPECS[StateInteractionIdService.savedMemento].name :
                '');
          };
          $scope.doesCurrentInteractionHaveCustomizations = function() {
            var interactionSpec = INTERACTION_SPECS[
              StateInteractionIdService.savedMemento];
            return (
              interactionSpec &&
              interactionSpec.customization_arg_specs.length > 0);
          };

          var _getInteractionPreviewTag = function(
              interactionCustomizationArgs) {
            if (!StateInteractionIdService.savedMemento) {
              return '';
            }
            return ExplorationHtmlFormatterService.getInteractionHtml(
              StateInteractionIdService.savedMemento,
              interactionCustomizationArgs, false);
          };

          var _updateInteractionPreviewAndAnswerChoices = function() {
            $scope.interactionId = StateInteractionIdService.savedMemento;

            var currentCustomizationArgs =
              StateCustomizationArgsService.savedMemento;
            $scope.interactionPreviewHtml = _getInteractionPreviewTag(
              currentCustomizationArgs);

            $rootScope.$broadcast(
              'updateAnswerChoices',
              StateEditorService.getAnswerChoices(
                $scope.interactionId, currentCustomizationArgs));
          };

          $scope.$on('stateEditorInitialized', function(evt, stateData) {
            $scope.hasLoaded = false;
            InteractionDetailsCacheService.reset();
            $rootScope.$broadcast('initializeAnswerGroups', {
              interactionId: stateData.interaction.id,
              answerGroups: stateData.interaction.answerGroups,
              defaultOutcome: stateData.interaction.defaultOutcome,
              confirmedUnclassifiedAnswers: (
                stateData.interaction.confirmedUnclassifiedAnswers)
            });

            _updateInteractionPreviewAndAnswerChoices();
            $scope.hasLoaded = true;
          });

          $rootScope.$broadcast('interactionEditorInitialized');

          // If a terminal interaction is selected for a state with no content,
          // this function sets the content to DEFAULT_TERMINAL_STATE_CONTENT.
          // NOTE TO DEVELOPERS: Callers of this function must ensure that the
          // current active state is a terminal one.
          var updateDefaultTerminalStateContentIfEmpty = function() {
            // Check if the content is currently empty, as expected.
            var previousContent = StateContentService.savedMemento;
            if (!previousContent.isEmpty()) {
              return;
            }
            // Update the state's content.
            StateContentService.displayed.setHtml(
              DEFAULT_TERMINAL_STATE_CONTENT);
            StateContentService.saveDisplayedValue();
            $scope.onSaveStateContent(StateContentService.displayed);
          };

          $scope.onCustomizationModalSavePostHook = function() {
            var hasInteractionIdChanged = (
              StateInteractionIdService.displayed !==
              StateInteractionIdService.savedMemento);
            if (hasInteractionIdChanged) {
              if (INTERACTION_SPECS[StateInteractionIdService.displayed]
                .is_terminal) {
                updateDefaultTerminalStateContentIfEmpty();
              }
              StateInteractionIdService.saveDisplayedValue();
              $scope.onSaveInteractionId(StateInteractionIdService.displayed);
            }

            StateCustomizationArgsService.saveDisplayedValue();
            $scope.onSaveInteractionCustomizationArgs(
              StateCustomizationArgsService.displayed
            );

            InteractionDetailsCacheService.set(
              StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento);

            // This must be called here so that the rules are updated before the
            // state graph is recomputed.
            if (hasInteractionIdChanged) {
              $rootScope.$broadcast(
                'onInteractionIdChanged',
                StateInteractionIdService.savedMemento);
            }

            $scope.recomputeGraph();
            _updateInteractionPreviewAndAnswerChoices();
          };

          $scope.openInteractionCustomizerModal = function() {
            if (EditabilityService.isEditable()) {
              AlertsService.clearWarnings();

              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/exploration_editor/editor_tab/' +
                  'customize_interaction_modal_directive.html'),
                backdrop: true,
                resolve: {},
                controller: [
                  '$injector', '$scope', '$uibModalInstance',
                  'EditorFirstTimeEventsService',
                  'InteractionDetailsCacheService',
                  'StateCustomizationArgsService', 'StateEditorService',
                  'StateInteractionIdService', 'StateSolutionService',
                  'UrlInterpolationService', 'ALLOWED_INTERACTION_CATEGORIES',
                  'ALLOWED_QUESTION_INTERACTION_CATEGORIES',
                  'INTERACTION_SPECS',
                  function(
                      $injector, $scope, $uibModalInstance,
                      EditorFirstTimeEventsService,
                      InteractionDetailsCacheService,
                      StateCustomizationArgsService, StateEditorService,
                      StateInteractionIdService, StateSolutionService,
                      UrlInterpolationService, ALLOWED_INTERACTION_CATEGORIES,
                      ALLOWED_QUESTION_INTERACTION_CATEGORIES,
                      INTERACTION_SPECS) {
                    EditorFirstTimeEventsService
                      .registerFirstClickAddInteractionEvent();

                    // This binds the services to the HTML template, so that
                    // their displayed values can be used in the HTML.
                    $scope.StateInteractionIdService =
                      StateInteractionIdService;
                    $scope.StateCustomizationArgsService = (
                      StateCustomizationArgsService);

                    $scope.getInteractionThumbnailImageUrl = (
                      UrlInterpolationService.getInteractionThumbnailImageUrl);

                    $scope.INTERACTION_SPECS = INTERACTION_SPECS;

                    if (StateEditorService.isInQuestionMode()) {
                      $scope.ALLOWED_INTERACTION_CATEGORIES = (
                        ALLOWED_QUESTION_INTERACTION_CATEGORIES);
                    } else {
                      $scope.ALLOWED_INTERACTION_CATEGORIES = (
                        ALLOWED_INTERACTION_CATEGORIES);
                    }

                    if (StateInteractionIdService.savedMemento) {
                      $scope.customizationModalReopened = true;
                      var interactionSpec = INTERACTION_SPECS[
                        StateInteractionIdService.savedMemento];
                      $scope.customizationArgSpecs = (
                        interactionSpec.customization_arg_specs);

                      StateInteractionIdService.displayed = angular.copy(
                        StateInteractionIdService.savedMemento);
                      StateCustomizationArgsService.displayed = {};
                      // Ensure that StateCustomizationArgsService.displayed is
                      // fully populated.
                      for (
                        var i = 0; i < $scope.customizationArgSpecs.length;
                        i++) {
                        var argName = $scope.customizationArgSpecs[i].name;
                        StateCustomizationArgsService.displayed[argName] = {
                          value: (
                            StateCustomizationArgsService.savedMemento
                              .hasOwnProperty(argName) ?
                              angular.copy(
                                StateCustomizationArgsService.savedMemento[
                                  argName].value) :
                              angular.copy(
                                $scope.customizationArgSpecs[i].default_value)
                          )
                        };
                      }

                      $scope.$broadcast('schemaBasedFormsShown');
                      $scope.form = {};
                      $scope.hasCustomizationArgs = (Object.keys(
                        StateCustomizationArgsService.displayed).length > 0);
                    }

                    $scope.getCustomizationArgsWarningsList = function() {
                      var validationServiceName =
                        INTERACTION_SPECS[
                          $scope.StateInteractionIdService.displayed].id +
                        'ValidationService';
                      var validationService = $injector.get(
                        validationServiceName);
                      var warningsList =
                        validationService.getCustomizationArgsWarnings(
                          StateCustomizationArgsService.displayed);
                      return warningsList;
                    };

                    $scope.onChangeInteractionId = function(newInteractionId) {
                      EditorFirstTimeEventsService
                        .registerFirstSelectInteractionTypeEvent();

                      var interactionSpec = INTERACTION_SPECS[newInteractionId];
                      $scope.customizationArgSpecs = (
                        interactionSpec.customization_arg_specs);

                      StateInteractionIdService.displayed = newInteractionId;
                      StateCustomizationArgsService.displayed = {};
                      if (
                        InteractionDetailsCacheService.contains(
                          newInteractionId)) {
                        StateCustomizationArgsService.displayed = (
                          InteractionDetailsCacheService.get(
                            newInteractionId).customization);
                      } else {
                        $scope.customizationArgSpecs.forEach(function(caSpec) {
                          StateCustomizationArgsService.displayed[caSpec.name] =
                            {
                              value: angular.copy(caSpec.default_value)
                            };
                        });
                      }

                      if (Object.keys(
                        StateCustomizationArgsService.displayed).length === 0) {
                        $scope.save();
                        $scope.hasCustomizationArgs = false;
                      } else {
                        $scope.hasCustomizationArgs = true;
                      }

                      $scope.$broadcast('schemaBasedFormsShown');
                      $scope.form = {};
                    };

                    $scope.returnToInteractionSelector = function() {
                      InteractionDetailsCacheService.set(
                        StateInteractionIdService.displayed,
                        StateCustomizationArgsService.displayed);

                      StateInteractionIdService.displayed = null;
                      StateCustomizationArgsService.displayed = {};
                    };

                    $scope.isSaveInteractionButtonEnabled = function() {
                      return $scope.hasCustomizationArgs &&
                        $scope.StateInteractionIdService.displayed &&
                        $scope.form.schemaForm.$valid &&
                        $scope.getCustomizationArgsWarningsList().length === 0;
                    };

                    $scope.getSaveInteractionButtonTooltip = function() {
                      if (!$scope.hasCustomizationArgs) {
                        return 'No customization arguments';
                      }
                      if (!$scope.StateInteractionIdService.displayed) {
                        return 'No interaction being displayed';
                      }

                      var warningsList =
                        $scope.getCustomizationArgsWarningsList();
                      var warningMessages = warningsList.map(function(warning) {
                        return warning.message;
                      });

                      if (warningMessages.length === 0) {
                        if ($scope.form.schemaForm.$invalid) {
                          return 'Some of the form entries are invalid.';
                        } else {
                          return '';
                        }
                      } else {
                        return warningMessages.join(' ');
                      }
                    };

                    $scope.save = function() {
                      EditorFirstTimeEventsService
                        .registerFirstSaveInteractionEvent();
                      $uibModalInstance.close();
                    };

                    $scope.okay = function() {
                      $uibModalInstance.close('okay');
                    };

                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };
                  }
                ]
              }).result.then(
                $scope.onCustomizationModalSavePostHook, function() {
                  StateInteractionIdService.restoreFromMemento();
                  StateCustomizationArgsService.restoreFromMemento();
                });
            }
          };

          $scope.deleteInteraction = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'delete_interaction_modal_directive.html'),
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
              StateInteractionIdService.displayed = null;
              StateCustomizationArgsService.displayed = {};
              StateSolutionService.displayed = null;
              InteractionDetailsCacheService.removeDetails(
                StateInteractionIdService.savedMemento);
              StateInteractionIdService.saveDisplayedValue();
              $scope.onSaveInteractionId(StateInteractionIdService.displayed);

              StateCustomizationArgsService.saveDisplayedValue();
              $scope.onSaveInteractionCustomizationArgs(
                StateCustomizationArgsService.displayed
              );

              StateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(StateSolutionService.displayed);

              $rootScope.$broadcast(
                'onInteractionIdChanged',
                StateInteractionIdService.savedMemento);
              $scope.recomputeGraph();
              _updateInteractionPreviewAndAnswerChoices();
            });
          };
        }
      ]
    };
  }]);
