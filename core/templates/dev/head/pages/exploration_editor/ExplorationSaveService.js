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
 * @fileoverview Service for exploration saving & publication functionality.
 */

oppia.factory('ExplorationSaveService', [
  '$modal', '$timeout', '$rootScope', '$log', '$q',
  'AlertsService', 'ExplorationDataService', 'explorationStatesService',
  'explorationTagsService', 'explorationTitleService',
  'explorationObjectiveService', 'explorationCategoryService',
  'explorationLanguageCodeService', 'explorationRightsService',
  'explorationWarningsService', 'ExplorationDiffService',
  'explorationInitStateNameService', 'RouterService',
  'FocusManagerService', 'changeListService', 'siteAnalyticsService',
  'StatesObjectFactory', 'UrlInterpolationService',
  function(
      $modal, $timeout, $rootScope, $log, $q,
      AlertsService, ExplorationDataService, explorationStatesService,
      explorationTagsService, explorationTitleService,
      explorationObjectiveService, explorationCategoryService,
      explorationLanguageCodeService, explorationRightsService,
      explorationWarningsService, ExplorationDiffService,
      explorationInitStateNameService, RouterService,
      FocusManagerService, changeListService, siteAnalyticsService,
      StatesObjectFactory, UrlInterpolationService) {
    // Whether or not a save action is currently in progress
    // (request has been sent to backend but no reply received yet)
    var saveIsInProgress = false;

    // This flag is used to ensure only one save exploration modal can be open
    // at any one time.
    var modalIsOpen = false;

    var diffData = null;

    var isAdditionalMetadataNeeded = function() {
      return (
        !explorationTitleService.savedMemento ||
        !explorationObjectiveService.savedMemento ||
        !explorationCategoryService.savedMemento ||
        explorationLanguageCodeService.savedMemento ===
          constants.DEFAULT_LANGUAGE_CODE ||
        explorationTagsService.savedMemento.length === 0);
    };

    var areRequiredFieldsFilled = function() {
      if (!explorationTitleService.displayed) {
        AlertsService.addWarning('Please specify a title');
        return false;
      }
      if (!explorationObjectiveService.displayed) {
        AlertsService.addWarning('Please specify an objective');
        return false;
      }
      if (!explorationCategoryService.displayed) {
        AlertsService.addWarning('Please specify a category');
        return false;
      }

      return true;
    };

    var showCongratulatorySharingModal = function() {
      return $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/' +
          'post_publish_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', 'ExplorationContextService',
          function($scope, $modalInstance, ExplorationContextService) {
            $scope.congratsImgUrl = UrlInterpolationService.getStaticImageUrl(
              '/general/congrats.svg');
            $scope.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = (
              GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
            $scope.close = function() {
              $modalInstance.dismiss('cancel');
            };
            $scope.explorationId = (
              ExplorationContextService.getExplorationId());
          }
        ]
      });
    };

    var openPublishExplorationModal = function(
        onStartSaveCallback, onSaveDoneCallback) {
      // This is resolved when modal is closed.
      var whenModalClosed = $q.defer();

      var publishModalInstance = $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/' +
          'exploration_publish_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.publish = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
              whenModalClosed.resolve();
            };
          }
        ]
      });

      publishModalInstance.result.then(function() {
        if (onStartSaveCallback) {
          onStartSaveCallback();
        }

        explorationRightsService.publish().then(
          function() {
            if (onSaveDoneCallback) {
              onSaveDoneCallback();
            }

            showCongratulatorySharingModal();
            siteAnalyticsService.registerPublishExplorationEvent(
              ExplorationDataService.explorationId);
            whenModalClosed.resolve();
          });
      });

      return whenModalClosed.promise;
    };

    var saveDraftToBackend = function(commitMessage) {
      // Resolved when save is done
      // (regardless of success or failure of the operation).
      var whenSavingDone = $q.defer();

      var changeList = changeListService.getChangeList();

      if (explorationRightsService.isPrivate()) {
        siteAnalyticsService.registerCommitChangesToPrivateExplorationEvent(
          ExplorationDataService.explorationId);
      } else {
        siteAnalyticsService.registerCommitChangesToPublicExplorationEvent(
          ExplorationDataService.explorationId);
      }

      if (explorationWarningsService.countWarnings() === 0) {
        siteAnalyticsService.registerSavePlayableExplorationEvent(
          ExplorationDataService.explorationId);
      }
      saveIsInProgress = true;

      ExplorationDataService.save(
        changeList, commitMessage,
        function(isDraftVersionValid, draftChanges) {
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
          AlertsService.addSuccessMessage('Changes saved.');
          saveIsInProgress = false;
          whenSavingDone.resolve();
        }, function() {
          saveIsInProgress = false;
          whenSavingDone.resolve();
        }
      );
      return whenSavingDone.promise;
    };

    return {
      isExplorationSaveable: function() {
        return (
          changeListService.isExplorationLockedForEditing() &&
          !saveIsInProgress && (
            (explorationRightsService.isPrivate() &&
              !explorationWarningsService.hasCriticalWarnings()) ||
            (!explorationRightsService.isPrivate() &&
              explorationWarningsService.countWarnings() === 0)
          )
        );
      },

      discardChanges: function() {
        $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'confirm_discard_changes_modal_directive.html'),
          backdrop: 'static',
          keyboard: false,
          controller: [
            '$scope', '$modalInstance', function($scope, $modalInstance) {
              $scope.cancel = function() {
                $modalInstance.dismiss();
              };
              $scope.confirmDiscard = function() {
                $modalInstance.close();
              };
            }
          ]
        }).result.then(function() {
          AlertsService.clearWarnings();
          $rootScope.$broadcast('externalSave');

          $modal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'editor_reloading_modal_directive.html'),
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
          AlertsService.addSuccessMessage('Changes discarded.');
          $rootScope.$broadcast('initExplorationPage');

          // The reload is necessary because, otherwise, the
          // exploration-with-draft-changes will be reloaded
          // (since it is already cached in ExplorationDataService).
          location.reload();
        });
      },

      showPublishExplorationModal: function(
          onStartLoadingCallback, onEndLoadingCallback) {
        // This is resolved after publishing modals are closed,
        // so we can remove the loading-dots.
        var whenModalsClosed = $q.defer();

        siteAnalyticsService.registerOpenPublishExplorationModalEvent(
          ExplorationDataService.explorationId);
        AlertsService.clearWarnings();

        // If the metadata has not yet been specified, open the pre-publication
        // 'add exploration metadata' modal.
        if (isAdditionalMetadataNeeded()) {
          var modalInstance = $modal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'exploration_metadata_modal_directive.html'),
            backdrop: 'static',
            controller: [
              '$scope', '$modalInstance', 'explorationObjectiveService',
              'explorationTitleService', 'explorationCategoryService',
              'explorationStatesService', 'ALL_CATEGORIES',
              'explorationLanguageCodeService', 'explorationTagsService',
              function($scope, $modalInstance, explorationObjectiveService,
              explorationTitleService, explorationCategoryService,
              explorationStatesService, ALL_CATEGORIES,
              explorationLanguageCodeService, explorationTagsService) {
                $scope.explorationTitleService = explorationTitleService;
                $scope.explorationObjectiveService =
                  explorationObjectiveService;
                $scope.explorationCategoryService =
                  explorationCategoryService;
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
                  constants.DEFAULT_LANGUAGE_CODE);
                $scope.askForTags = (
                  explorationTagsService.savedMemento.length === 0);

                $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

                $scope.CATEGORY_LIST_FOR_SELECT2 = [];

                for (var i = 0; i < ALL_CATEGORIES.length; i++) {
                  $scope.CATEGORY_LIST_FOR_SELECT2.push({
                    id: ALL_CATEGORIES[i],
                    text: ALL_CATEGORIES[i]
                  });
                }

                if (explorationStatesService.isInitialized()) {
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
                  if (!areRequiredFieldsFilled()) {
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

                  // TODO(sll): Get rid of the $timeout here.
                  // It's currently used because there is a race condition: the
                  // saveDisplayedValue() calls above result in autosave calls.
                  // These race with the discardDraft() call that
                  // will be called when the draft changes entered here
                  // are properly saved to the backend.
                  $timeout(function() {
                    $modalInstance.close(metadataList);
                  }, 500);
                };

                $scope.cancel = function() {
                  whenModalsClosed.resolve();
                  explorationTitleService.restoreFromMemento();
                  explorationObjectiveService.restoreFromMemento();
                  explorationCategoryService.restoreFromMemento();
                  explorationLanguageCodeService.restoreFromMemento();
                  explorationTagsService.restoreFromMemento();

                  $modalInstance.dismiss('cancel');
                  AlertsService.clearWarnings();
                };
              }
            ]
          });

          modalInstance.opened.then(function() {
            // Toggle loading dots off after modal is opened
            if (onEndLoadingCallback) {
              onEndLoadingCallback();
            }
          });

          modalInstance.result.then(function(metadataList) {
            if (metadataList.length > 0) {
              var commitMessage = (
                'Add metadata: ' + metadataList.join(', ') + '.');

              if (onStartLoadingCallback) {
                onStartLoadingCallback();
              }

              saveDraftToBackend(commitMessage).then(function() {
                if (onEndLoadingCallback) {
                  onEndLoadingCallback();
                }
                openPublishExplorationModal(
                    onStartLoadingCallback, onEndLoadingCallback)
                  .then(function() {
                    whenModalsClosed.resolve();
                  });
              });
            } else {
              openPublishExplorationModal(
                  onStartLoadingCallback, onEndLoadingCallback)
                .then(function() {
                  whenModalsClosed.resolve();
                });
            }
          });
        } else {
          // No further metadata is needed. Open the publish modal immediately.
          openPublishExplorationModal(
              onStartLoadingCallback, onEndLoadingCallback)
            .then(function() {
              whenModalsClosed.resolve();
            });
        }
        return whenModalsClosed.promise;
      },

      saveChanges: function(onStartLoadingCallback, onEndLoadingCallback) {
        // This is marked as resolved after modal is closed, so we can change
        // controller 'saveIsInProgress' back to false.
        var whenModalClosed = $q.defer();

        RouterService.savePendingChanges();

        if (!explorationRightsService.isPrivate() &&
            explorationWarningsService.countWarnings() > 0) {
          // If the exploration is not private, warnings should be fixed before
          // it can be saved.
          AlertsService.addWarning(explorationWarningsService.getWarnings()[0]);
          return;
        }

        ExplorationDataService.getLastSavedData().then(function(data) {
          var oldStates = StatesObjectFactory.createFromBackendDict(
            data.states).getStateObjects();
          var newStates = explorationStatesService.getStates()
            .getStateObjects();
          var diffGraphData = ExplorationDiffService.getDiffGraphData(
            oldStates, newStates, [{
              changeList: changeListService.getChangeList(),
              directionForwards: true
            }]);
          diffData = {
            nodes: diffGraphData.nodes,
            links: diffGraphData.links,
            finalStateIds: diffGraphData.finalStateIds,
            v1InitStateId: diffGraphData.originalStateIds[data.init_state_name],
            v2InitStateId: diffGraphData.stateIds[
              explorationInitStateNameService.displayed],
            v1States: oldStates,
            v2States: newStates
          };

          // TODO(wxy): after diff supports exploration metadata, add a check to
          // exit if changes cancel each other out.

          AlertsService.clearWarnings();

          // If the modal is open, do not open another one.
          if (modalIsOpen) {
            return;
          }

          var modalInstance = $modal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'exploration_save_modal_directive.html'),
            backdrop: true,
            resolve: {
              isExplorationPrivate: function() {
                return explorationRightsService.isPrivate();
              },
              diffData: function() {
                return diffData;
              }
            },
            windowClass: 'oppia-save-exploration-modal',
            controller: [
              '$scope', '$modalInstance', 'isExplorationPrivate',
              function(
                $scope, $modalInstance, isExplorationPrivate) {
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
                  AlertsService.clearWarnings();
                };
              }
            ]
          });

          // Modal is Opened
          modalIsOpen = true;

          modalInstance.opened.then(function() {
            // Toggle loading dots off after modal is opened
            if (onEndLoadingCallback) {
              onEndLoadingCallback();
            }
            // The $timeout seems to be needed
            // in order to give the modal time to render.
            $timeout(function() {
              FocusManagerService.setFocus('saveChangesModalOpened');
            });
          });

          modalInstance.result.then(function(commitMessage) {
            modalIsOpen = false;

            // Toggle loading dots back on for loading from backend.
            if (onStartLoadingCallback) {
              onStartLoadingCallback();
            }

            saveDraftToBackend(commitMessage).then(function() {
              whenModalClosed.resolve();
            });
          }, function() {
            modalIsOpen = false;
            whenModalClosed.resolve();
          });
        });
        return whenModalClosed.promise;
      }
    };
  }
]);
