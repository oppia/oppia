
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
<<<<<<< HEAD
 * @fileoverview Directive for showing Save and Publish buttons
 * in Exploration Editor
 */

oppia.directive('explorationSaveAndPublishButtons', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/exploration_save_and_publish_buttons_directive',
    controller: [
      '$scope', '$http', '$rootScope', '$window', '$timeout', '$modal', '$log',
      'alertsService', 'changeListService', 'focusService', 'routerService',
      'explorationData', 'explorationRightsService', 'editabilityService',
      'explorationWarningsService', 'siteAnalyticsService',
      'explorationObjectiveService', 'explorationTitleService',
      'explorationCategoryService', 'explorationStatesService', 'CATEGORY_LIST',
      'explorationLanguageCodeService', 'explorationTagsService',
      'autosaveInfoModalsService', 'ExplorationDiffService',
      'explorationInitStateNameService',
      function(
          $scope, $http, $rootScope, $window, $timeout, $modal, $log,
          alertsService, changeListService, focusService, routerService,
          explorationData, explorationRightsService, editabilityService,
          explorationWarningsService, siteAnalyticsService,
          explorationObjectiveService, explorationTitleService,
          explorationCategoryService, explorationStatesService, CATEGORY_LIST,
          explorationLanguageCodeService, explorationTagsService,
          autosaveInfoModalsService, ExplorationDiffService,
          explorationInitStateNameService) {
        // Whether or not a save action is currently in progress.
        $scope.isSaveInProgress = false;
        // Whether or not a discard action is currently in progress.
        $scope.isDiscardInProgress = false;
        // The last 'save' or 'discard' action. Can be null (no such action has
        // been performed yet), 'save' (the last action was a save) or 'discard'
        // (the last action was a discard).
        $scope.lastSaveOrDiscardAction = null;

        $scope.isPrivate = function() {
          return explorationRightsService.isPrivate();
        };

        $scope.isExplorationLockedForEditing = function() {
          return changeListService.isExplorationLockedForEditing();
        };
        $scope.isEditableOutsideTutorialMode = function() {
          return editabilityService.isEditableOutsideTutorialMode();
        };
        $scope.countWarnings = function() {
          return explorationWarningsService.countWarnings();
        };

        $scope.discardChanges = function() {
          var confirmDiscard = confirm(
            'Are you sure you want to discard your changes?');

          if (confirmDiscard) {
            alertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');
            $scope.isDiscardInProgress = true;
            $modal.open({
              templateUrl: 'modals/reloadingEditor',
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$modalInstance', function($scope, $modalInstance) {
                  $timeout(function() {
                    $modalInstance.dismiss('cancel');
                  }, 2500);
                }
              ],
              windowClass: 'oppia-loading-modal'
            });
            changeListService.discardAllChanges();
            alertsService.addSuccessMessage('Changes discarded.');
            $rootScope.$broadcast('initExplorationPage', function() {
              $scope.lastSaveOrDiscardAction = 'discard';
              $scope.isDiscardInProgress = false;
            });

            // The reload is necessary because, otherwise, the
            // exploration-with-draft-changes will be reloaded
            // (since it is already cached in explorationData).
            location.reload();
          }
        };

        $scope.getChangeListLength = function() {
          return changeListService.getChangeList().length;
        };

        $scope.isExplorationSaveable = function() {
          return (
            $scope.isExplorationLockedForEditing() &&
            !$scope.isSaveInProgress && (
              ($scope.isPrivate() &&
                !explorationWarningsService.hasCriticalWarnings()) ||
              (!$scope.isPrivate() &&
                explorationWarningsService.countWarnings() === 0)
            )
          );
        };

        $scope.isPublic = function() {
          return explorationRightsService.isPublic();
        };

        $scope.showCongratulatorySharingModal = function() {
          $modal.open({
            templateUrl: 'modals/shareExplorationAfterPublish',
            backdrop: true,
            controller: [
              '$scope', '$modalInstance', 'explorationContextService',
              'UrlInterpolationService',
              function($scope, $modalInstance, explorationContextService,
                UrlInterpolationService) {
                $scope.congratsImgUrl = (
                  UrlInterpolationService.getStaticImageUrl(
                  '/general/congrats.svg'));
                $scope.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = (
                  GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
                $scope.close = function() {
                  $modalInstance.dismiss('cancel');
                };
                $scope.explorationId = (
                  explorationContextService.getExplorationId());
              }
            ]
          });
        };

        var saveDraftToBackend = function(commitMessage, successCallback) {
          var changeList = changeListService.getChangeList();

          if ($scope.isPrivate()) {
            siteAnalyticsService.registerCommitChangesToPrivateExplorationEvent(
              explorationData.explorationId);
          } else {
            siteAnalyticsService.registerCommitChangesToPublicExplorationEvent(
              explorationData.explorationId);
          }

          if (explorationWarningsService.countWarnings() === 0) {
            siteAnalyticsService.registerSavePlayableExplorationEvent(
              explorationData.explorationId);
          }
          $scope.isSaveInProgress = true;

          explorationData.save(
            changeList, commitMessage, function(isDraftVersionValid,
              draftChanges) {
              if (isDraftVersionValid === false &&
                  draftChanges !== null &&
                  draftChanges.length > 0) {
                autosaveInfoModalsService.showVersionMismatchModal(changeList);
                return;
              }
              $log.info('Changes to this exploration were saved successfully.');
              changeListService.discardAllChanges();
              $rootScope.$broadcast('initExplorationPage');
              $rootScope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });
              alertsService.addSuccessMessage('Changes saved.');
              $scope.lastSaveOrDiscardAction = 'save';
              $scope.isSaveInProgress = false;
              if (successCallback) {
                successCallback();
              }
            }, function() {
              $scope.isSaveInProgress = false;
            }
          );
        };

        var openPublishExplorationModal = function() {
          $scope.publishModalIsOpening = true;
          var publishModalInstance = $modal.open({
            templateUrl: 'modals/publishExploration',
            backdrop: true,
            controller: [
              '$scope', '$modalInstance', function($scope, $modalInstance) {
                $scope.publish = $modalInstance.close;

                $scope.cancel = function() {
                  $modalInstance.dismiss('cancel');
                  alertsService.clearWarnings();
                };
              }
            ]
          });

          publishModalInstance.result.then(function() {
            explorationRightsService.saveChangeToBackend({
              is_public: true
            });
            siteAnalyticsService.registerPublishExplorationEvent(
              explorationData.explorationId);
            $scope.showCongratulatorySharingModal();
          });

          publishModalInstance.opened.then(function() {
            $scope.publishModalIsOpening = false;
          });
        };

        $scope.showPublishExplorationModal = function() {
          siteAnalyticsService.registerOpenPublishExplorationModalEvent(
            explorationData.explorationId);
          alertsService.clearWarnings();

          var additionalMetadataNeeded = (
            !explorationTitleService.savedMemento ||
            !explorationObjectiveService.savedMemento ||
            !explorationCategoryService.savedMemento ||
            explorationLanguageCodeService.savedMemento ===
              GLOBALS.DEFAULT_LANGUAGE_CODE ||
            explorationTagsService.savedMemento.length === 0);

          // If the metadata has not yet been specified, open the
          // pre-publication 'add exploration metadata' modal.
          if (additionalMetadataNeeded) {
            $modal.open({
              templateUrl: 'modals/addExplorationMetadata',
              backdrop: 'static',
              controller: [
                '$scope', '$modalInstance', 'explorationObjectiveService',
                'explorationTitleService', 'explorationCategoryService',
                'explorationStatesService', 'CATEGORY_LIST',
                'explorationLanguageCodeService', 'explorationTagsService',
                function($scope, $modalInstance, explorationObjectiveService,
                explorationTitleService, explorationCategoryService,
                explorationStatesService, CATEGORY_LIST,
                explorationLanguageCodeService, explorationTagsService) {
                  $scope.explorationTitleService = (
                    explorationTitleService);
                  $scope.explorationObjectiveService = (
                    explorationObjectiveService);
                  $scope.explorationCategoryService = (
                    explorationCategoryService);
                  $scope.explorationLanguageCodeService = (
                    explorationLanguageCodeService);
                  $scope.explorationTagsService = explorationTagsService;

                  $scope.objectiveHasBeenPreviouslyEdited = (
                    explorationObjectiveService.savedMemento.length > 0);

                  $scope.requireTitleToBeSpecified = (
                    !explorationTitleService.savedMemento);
                  $scope.requireObjectiveToBeSpecified = (
                    explorationObjectiveService.savedMemento.length < 15);
                  $scope.requireCategoryToBeSpecified = (
                    !explorationCategoryService.savedMemento);
                  $scope.askForLanguageCheck = (
                    explorationLanguageCodeService.savedMemento ===
                    GLOBALS.DEFAULT_LANGUAGE_CODE);
                  $scope.askForTags = (
                    explorationTagsService.savedMemento.length === 0);

                  $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

                  $scope.CATEGORY_LIST_FOR_SELECT2 = [];

                  for (var i = 0; i < CATEGORY_LIST.length; i++) {
                    $scope.CATEGORY_LIST_FOR_SELECT2.push({
                      id: CATEGORY_LIST[i],
                      text: CATEGORY_LIST[i]
                    });
                  }

                  var _states = explorationStatesService.getStates();
                  if (_states) {
                    var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2
                    .some(
                      function(categoryItem) {
                        return categoryItem.id ===
                        explorationCategoryService.savedMemento;
                      }
                    );

                    // If the current category is not in the dropdown, add it
                    // as the first option.
                    if (!categoryIsInSelect2 &&
                        explorationCategoryService.savedMemento) {
                      $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
                        id: explorationCategoryService.savedMemento,
                        text: explorationCategoryService.savedMemento
                      });
                    }
                  }

                  $scope.isSavingAllowed = function() {
                    return Boolean(
                      explorationTitleService.displayed &&
                      explorationObjectiveService.displayed &&
                      explorationObjectiveService.displayed.length >= 15 &&
                      explorationCategoryService.displayed &&
                      explorationLanguageCodeService.displayed);
                  };

                  $scope.save = function() {
                    if (!explorationTitleService.displayed) {
                      alertsService.addWarning('Please specify a title');
                      return;
                    }
                    if (!explorationObjectiveService.displayed) {
                      alertsService.addWarning('Please specify an objective');
                      return;
                    }
                    if (!explorationCategoryService.displayed) {
                      alertsService.addWarning('Please specify a category');
                      return;
                    }

                    // Record any fields that have changed.
                    var metadataList = [];
                    if (explorationTitleService.hasChanged()) {
                      metadataList.push('title');
                    }
                    if (explorationObjectiveService.hasChanged()) {
                      metadataList.push('objective');
                    }
                    if (explorationCategoryService.hasChanged()) {
                      metadataList.push('category');
                    }
                    if (explorationLanguageCodeService.hasChanged()) {
                      metadataList.push('language');
                    }
                    if (explorationTagsService.hasChanged()) {
                      metadataList.push('tags');
                    }

                    // Save all the displayed values.
                    explorationTitleService.saveDisplayedValue();
                    explorationObjectiveService.saveDisplayedValue();
                    explorationCategoryService.saveDisplayedValue();
                    explorationLanguageCodeService.saveDisplayedValue();
                    explorationTagsService.saveDisplayedValue();

                    // TODO(sll): Get rid of the $timeout here. It's currently
                    // used because there is a race condition:
                    // the saveDisplayedValue() calls above result
                    // in autosave calls. These race with the
                    // discardDraft() call that will be called when the draft
                    // changes entered here are properly saved to the backend.
                    $timeout(function() {
                      $modalInstance.close(metadataList);
                    }, 500);
                  };

                  $scope.cancel = function() {
                    explorationTitleService.restoreFromMemento();
                    explorationObjectiveService.restoreFromMemento();
                    explorationCategoryService.restoreFromMemento();
                    explorationLanguageCodeService.restoreFromMemento();
                    explorationTagsService.restoreFromMemento();

                    $modalInstance.dismiss('cancel');
                    alertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(metadataList) {
              if (metadataList.length > 0) {
                var commitMessage = (
                  'Add metadata: ' + metadataList.join(', ') + '.');
                saveDraftToBackend(commitMessage, openPublishExplorationModal);
              } else {
                openPublishExplorationModal();
              }
            });
          } else {
            // No further metadata is needed.
            // Open the publish modal immediately.
            openPublishExplorationModal();
          }
        };

        $scope.getPublishExplorationButtonTooltip = function() {
          if (explorationWarningsService.countWarnings() > 0) {
            return 'Please resolve the warnings before publishing.';
          } else if ($scope.isExplorationLockedForEditing()) {
            return 'Please save your changes before publishing.';
          } else {
            return 'Publish to Oppia Library';
          }
        };

        $scope.getSaveButtonTooltip = function() {
          if (explorationWarningsService.hasCriticalWarnings() > 0) {
            return 'Please resolve the warnings.';
          } else if ($scope.isPrivate()) {
            return 'Save Draft';
          } else {
            return 'Publish Changes';
          }
        };

        // This flag is used to ensure only one save exploration modal
        // can be open at any one time.
        var _modalIsOpen = false;

        $scope.saveChanges = function() {
          // This flag is used to change text of save button to "Loading..." to
          // add indication for user that something is happening.
          $scope.saveModalIsOpening = true;

          routerService.savePendingChanges();

          if (!explorationRightsService.isPrivate() &&
              explorationWarningsService.countWarnings() > 0) {
            // If the exploration is not private, warnings should be fixed
            // before it can be saved.
            alertsService.addWarning(
              explorationWarningsService.getWarnings()[0]);
            return;
          }

          explorationData.getLastSavedData().then(function(data) {
            var oldStates = data.states;
            var newStates = explorationStatesService.getStates();
            var diffGraphData = ExplorationDiffService.getDiffGraphData(
              oldStates, newStates, [{
                changeList: changeListService.getChangeList(),
                directionForwards: true
              }]);
            $scope.diffData = {
              nodes: diffGraphData.nodes,
              links: diffGraphData.links,
              finalStateIds: diffGraphData.finalStateIds,
              v1InitStateId: (
                diffGraphData.originalStateIds[data.init_state_name]),
              v2InitStateId: diffGraphData.stateIds[
                explorationInitStateNameService.displayed],
              v1States: oldStates,
              v2States: newStates
            };

            // TODO(wxy): after diff supports exploration metadata, add a check
            // to exit if changes cancel each other out.

            alertsService.clearWarnings();

            // If the modal is open, do not open another one.
            if (_modalIsOpen) {
              return;
            }

            var modalInstance = $modal.open({
              templateUrl: 'modals/saveExploration',
              backdrop: true,
              resolve: {
                isExplorationPrivate: function() {
                  return explorationRightsService.isPrivate();
                },
                diffData: function() {
                  return $scope.diffData;
                }
              },
              windowClass: 'oppia-save-exploration-modal',
              controller: [
                '$scope', '$modalInstance', 'isExplorationPrivate', 'diffData',
                function($scope, $modalInstance, isExplorationPrivate,
                  diffData) {
                  $scope.showDiff = false;
                  $scope.onClickToggleDiffButton = function() {
                    $scope.showDiff = !$scope.showDiff;
                    if ($scope.showDiff) {
                      $('.oppia-save-exploration-modal').addClass(
                        'oppia-save-exploration-wide-modal');
                    } else {
                      $('.oppia-save-exploration-modal').removeClass(
                        'oppia-save-exploration-wide-modal');
                    }
                  };

                  $scope.diffData = diffData;
                  $scope.isExplorationPrivate = isExplorationPrivate;

                  $scope.earlierVersionHeader = 'Last saved';
                  $scope.laterVersionHeader = 'New changes';

                  $scope.save = function(commitMessage) {
                    $modalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    alertsService.clearWarnings();
                  };
                }
              ]
            });

            // Modal is Opened
            _modalIsOpen = true;
            $scope.saveModalIsOpening = false;

            modalInstance.opened.then(function() {
              // The $timeout seems to be needed in order to give the modal
              // time to render.
              $timeout(function() {
                focusService.setFocus('saveChangesModalOpened');
              });
            });

            modalInstance.result.then(function(commitMessage) {
              _modalIsOpen = false;
              saveDraftToBackend(commitMessage);
            }, function() {
              _modalIsOpen = false;
            });
          });
        };
      }
    ]
  };
}]);
