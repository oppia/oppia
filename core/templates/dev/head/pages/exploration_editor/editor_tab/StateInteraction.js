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
 * @fileoverview Controllers for a state's interaction editor.
 */

oppia.controller('StateInteraction', [
  '$scope', '$http', '$rootScope', '$modal', '$injector', '$filter',
  'AlertsService', 'editorContextService', 'HtmlEscaperService',
  'INTERACTION_SPECS', 'stateInteractionIdService',
  'stateCustomizationArgsService', 'editabilityService',
  'explorationStatesService', 'graphDataService', 
  'InteractionDetailsCacheService',
  'ExplorationHtmlFormatterService', 'UrlInterpolationService',
  'SubtitledHtmlObjectFactory', 'stateSolutionService', 'stateContentService',
  function($scope, $http, $rootScope, $modal, $injector, $filter,
      AlertsService, editorContextService, HtmlEscaperService,
      INTERACTION_SPECS, stateInteractionIdService,
      stateCustomizationArgsService, editabilityService,
      explorationStatesService, graphDataService,
      InteractionDetailsCacheService,
      ExplorationHtmlFormatterService, UrlInterpolationService,
      SubtitledHtmlObjectFactory, stateSolutionService, stateContentService) {
    var DEFAULT_TERMINAL_STATE_CONTENT = 'Congratulations, you have finished!';

    // Declare dummy submitAnswer() and adjustPageHeight() methods for the
    // interaction preview.
    $scope.submitAnswer = function() {};
    $scope.adjustPageHeight = function() {};

    $scope.stateInteractionIdService = stateInteractionIdService;
    $scope.hasLoaded = false;
    $scope.customizationModalReopened = false;

    $scope.userBlueImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/avatar/user_blue_72px.png');
    $scope.userBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/avatar/user_black_72px.png');

    $scope.getCurrentInteractionName = function() {
      return (
        stateInteractionIdService.savedMemento ?
        INTERACTION_SPECS[stateInteractionIdService.savedMemento].name : '');
    };

    $scope.doesCurrentInteractionHaveCustomizations = function() {
      var interactionSpec = INTERACTION_SPECS[
        stateInteractionIdService.savedMemento];
      return (
        interactionSpec && interactionSpec.customization_arg_specs.length > 0);
    };

    var _getInteractionPreviewTag = function(interactionCustomizationArgs) {
      if (!stateInteractionIdService.savedMemento) {
        return '';
      }
      return ExplorationHtmlFormatterService.getInteractionHtml(
        stateInteractionIdService.savedMemento, interactionCustomizationArgs);
    };

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      $scope.hasLoaded = false;

      InteractionDetailsCacheService.reset();

      $scope.stateName = editorContextService.getActiveStateName();

      stateInteractionIdService.init(
        $scope.stateName, stateData.interaction.id);
      stateCustomizationArgsService.init(
        $scope.stateName, stateData.interaction.customizationArgs);

      stateSolutionService.init(
        editorContextService.getActiveStateName(),
        stateData.interaction.solution);

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

    // If a terminal interaction is selected for a state with no content, this
    // function sets the content to DEFAULT_TERMINAL_STATE_CONTENT.
    // NOTE TO DEVELOPERS: Callers of this function must ensure that the current
    // active state is a terminal one.
    var updateDefaultTerminalStateContentIfEmpty = function() {
      // Get current state.
      var stateName = editorContextService.getActiveStateName();

      // Check if the content is currently empty, as expected.
      var previousContent = stateContentService.savedMemento;
      if (!previousContent.isEmpty()) {
        return;
      }

      // Update the state's content.
      stateContentService.displayed = SubtitledHtmlObjectFactory.createDefault(
        DEFAULT_TERMINAL_STATE_CONTENT);
      stateContentService.saveDisplayedValue();
    };

    $scope.onCustomizationModalSavePostHook = function() {
      var hasInteractionIdChanged = (
        stateInteractionIdService.displayed !==
        stateInteractionIdService.savedMemento);
      if (hasInteractionIdChanged) {
        if (INTERACTION_SPECS[stateInteractionIdService.displayed]
          .is_terminal) {
          updateDefaultTerminalStateContentIfEmpty();
        }
        stateInteractionIdService.saveDisplayedValue();
      }

      stateCustomizationArgsService.saveDisplayedValue();

      InteractionDetailsCacheService.set(
        stateInteractionIdService.savedMemento,
        stateCustomizationArgsService.savedMemento);

      // This must be called here so that the rules are updated before the state
      // graph is recomputed.
      if (hasInteractionIdChanged) {
        $rootScope.$broadcast(
          'onInteractionIdChanged', stateInteractionIdService.savedMemento);
      }

      graphDataService.recompute();
      _updateInteractionPreviewAndAnswerChoices();
    };

    $scope.openInteractionCustomizerModal = function() {
      if (editabilityService.isEditable()) {
        AlertsService.clearWarnings();

        $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/editor_tab/' +
            'customize_interaction_modal_directive.html'),
          backdrop: true,
          resolve: {},
          controller: [
            '$scope', '$modalInstance', '$injector', 'stateSolutionService',
            'stateInteractionIdService', 'stateCustomizationArgsService',
            'InteractionDetailsCacheService', 'INTERACTION_SPECS',
            'UrlInterpolationService', 'editorFirstTimeEventsService',
            function(
                $scope, $modalInstance, $injector, stateSolutionService,
                stateInteractionIdService, stateCustomizationArgsService,
                InteractionDetailsCacheService, INTERACTION_SPECS,
                UrlInterpolationService, editorFirstTimeEventsService) {
              editorFirstTimeEventsService
                .registerFirstClickAddInteractionEvent();

              // This binds the services to the HTML template, so that their
              // displayed values can be used in the HTML.
              $scope.stateInteractionIdService = stateInteractionIdService;
              $scope.stateCustomizationArgsService = (
                stateCustomizationArgsService);

              $scope.getInteractionThumbnailImageUrl = (
                UrlInterpolationService.getInteractionThumbnailImageUrl);

              $scope.INTERACTION_SPECS = INTERACTION_SPECS;
              $scope.ALLOWED_INTERACTION_CATEGORIES = (
                GLOBALS.ALLOWED_INTERACTION_CATEGORIES);

              if (stateInteractionIdService.savedMemento) {
                $scope.customizationModalReopened = true;
                var interactionSpec = INTERACTION_SPECS[
                  stateInteractionIdService.savedMemento];
                $scope.customizationArgSpecs = (
                  interactionSpec.customization_arg_specs);

                stateInteractionIdService.displayed = angular.copy(
                  stateInteractionIdService.savedMemento);
                stateCustomizationArgsService.displayed = {};
                // Ensure that stateCustomizationArgsService.displayed is fully
                // populated.
                for (var i = 0; i < $scope.customizationArgSpecs.length; i++) {
                  var argName = $scope.customizationArgSpecs[i].name;
                  stateCustomizationArgsService.displayed[argName] = {
                    value: (
                      stateCustomizationArgsService.savedMemento.hasOwnProperty(
                        argName) ?
                      angular.copy(
                        stateCustomizationArgsService.savedMemento[
                          argName].value) :
                      angular.copy(
                        $scope.customizationArgSpecs[i].default_value)
                    )
                  };
                }

                $scope.$broadcast('schemaBasedFormsShown');
                $scope.form = {};
                $scope.hasCustomizationArgs = (Object.keys(
                  stateCustomizationArgsService.displayed).length > 0);
              }

              $scope.getCustomizationArgsWarningsList = function() {
                var validationServiceName =
                  INTERACTION_SPECS[
                    $scope.stateInteractionIdService.displayed].id +
                  'ValidationService';
                var validationService = $injector.get(validationServiceName);
                var warningsList =
                  validationService.getCustomizationArgsWarnings(
                    stateCustomizationArgsService.displayed);
                return warningsList;
              }

              $scope.onChangeInteractionId = function(newInteractionId) {
                editorFirstTimeEventsService
                  .registerFirstSelectInteractionTypeEvent();

                var interactionSpec = INTERACTION_SPECS[newInteractionId];
                $scope.customizationArgSpecs = (
                  interactionSpec.customization_arg_specs);

                stateInteractionIdService.displayed = newInteractionId;
                stateCustomizationArgsService.displayed = {};
                if (InteractionDetailsCacheService.contains(newInteractionId)) {
                  stateCustomizationArgsService.displayed = (
                    InteractionDetailsCacheService.get(
                      newInteractionId).customization);
                } else {
                  $scope.customizationArgSpecs.forEach(function(caSpec) {
                    stateCustomizationArgsService.displayed[caSpec.name] = {
                      value: angular.copy(caSpec.default_value)
                    };
                  });
                }

                if (Object.keys(
                  stateCustomizationArgsService.displayed).length === 0) {
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
                  stateInteractionIdService.displayed,
                  stateCustomizationArgsService.displayed);

                stateInteractionIdService.displayed = null;
                stateCustomizationArgsService.displayed = {};
              };

              $scope.isSaveInteractionButtonEnabled = function() {
                return $scope.hasCustomizationArgs &&
                  $scope.stateInteractionIdService.displayed &&
                  $scope.form.schemaForm.$valid &&
                  $scope.getCustomizationArgsWarningsList().length === 0;
              };

              $scope.getSaveInteractionButtonTooltip = function() {
                if (!$scope.hasCustomizationArgs) {
                  return 'No customization arguments';
                }
                if (!$scope.stateInteractionIdService.displayed) {
                  return 'No interaction being displayed';
                }

                var warningsList = $scope.getCustomizationArgsWarningsList();
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
                editorFirstTimeEventsService
                  .registerFirstSaveInteractionEvent();
                $modalInstance.close();
              };

              $scope.okay = function() {
                $modalInstance.close('okay');
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };
            }
          ]
        }).result.then($scope.onCustomizationModalSavePostHook, function() {
          stateInteractionIdService.restoreFromMemento();
          stateCustomizationArgsService.restoreFromMemento();
        });
      }
    };

    $scope.deleteInteraction = function() {
      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'delete_interaction_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        stateInteractionIdService.displayed = null;
        stateCustomizationArgsService.displayed = {};
        stateSolutionService.displayed = null;

        stateInteractionIdService.saveDisplayedValue();
        stateCustomizationArgsService.saveDisplayedValue();
        stateSolutionService.saveDisplayedValue();
        $rootScope.$broadcast(
          'onInteractionIdChanged', stateInteractionIdService.savedMemento);
        graphDataService.recompute();
        _updateInteractionPreviewAndAnswerChoices();
      });
    };

    var _updateInteractionPreviewAndAnswerChoices = function() {
      $scope.interactionId = stateInteractionIdService.savedMemento;

      var currentCustomizationArgs = stateCustomizationArgsService.savedMemento;
      $scope.interactionPreviewHtml = _getInteractionPreviewTag(
        currentCustomizationArgs);

      // Special cases for multiple choice input and image click input.
      if ($scope.interactionId === 'MultipleChoiceInput') {
        $rootScope.$broadcast(
          'updateAnswerChoices',
          currentCustomizationArgs.choices.value.map(function(val, ind) {
            return {
              val: ind,
              label: val
            };
          })
        );
      } else if ($scope.interactionId === 'ImageClickInput') {
        var _answerChoices = [];
        var imageWithRegions = currentCustomizationArgs.imageAndRegions.value;
        for (var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
          _answerChoices.push({
            val: imageWithRegions.labeledRegions[j].label,
            label: imageWithRegions.labeledRegions[j].label
          });
        }

        $rootScope.$broadcast('updateAnswerChoices', _answerChoices);
      } else if ($scope.interactionId === 'ItemSelectionInput') {
        $rootScope.$broadcast(
          'updateAnswerChoices',
          currentCustomizationArgs.choices.value.map(function(val) {
            return {
              val: val,
              label: val
            };
          })
        );
      } else {
        $rootScope.$broadcast('updateAnswerChoices', null);
      }
    };
  }
]);

oppia.directive('testInteractionPanel', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        stateContent: '&',
        inputTemplate: '&',
        onSubmitAnswer: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'test_interaction_modal_directive.html'),
      controller: [
        '$scope', 'editorContextService', 'explorationStatesService',
        'INTERACTION_SPECS', 'INTERACTION_DISPLAY_MODE_INLINE',
        function($scope, editorContextService, explorationStatesService,
            INTERACTION_SPECS, INTERACTION_DISPLAY_MODE_INLINE) {
          var _stateName = editorContextService.getActiveStateName();
          var _state = explorationStatesService.getState(_stateName);
          $scope.interactionIsInline = (
            INTERACTION_SPECS[_state.interaction.id].display_mode ===
            INTERACTION_DISPLAY_MODE_INLINE);
          $scope.submitAnswer = function(answer) {
            $scope.onSubmitAnswer({
              answer: answer
            });
          };
        }
      ]
    };
  }
]);
