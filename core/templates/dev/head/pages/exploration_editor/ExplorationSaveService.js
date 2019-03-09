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
  '$log', '$q', '$rootScope', '$timeout', '$uibModal',
  'AlertsService', 'AutosaveInfoModalsService', 'ChangeListService',
  'ExplorationCategoryService', 'ExplorationDataService',
  'ExplorationDiffService', 'ExplorationInitStateNameService',
  'ExplorationLanguageCodeService', 'ExplorationObjectiveService',
  'ExplorationRightsService', 'ExplorationStatesService',
  'ExplorationTagsService',
  'ExplorationTitleService', 'ExplorationWarningsService',
  'FocusManagerService',
  'RouterService', 'SiteAnalyticsService', 'StatesObjectFactory',
  'UrlInterpolationService',
  function(
      $log, $q, $rootScope, $timeout, $uibModal,
      AlertsService, AutosaveInfoModalsService, ChangeListService,
      ExplorationCategoryService, ExplorationDataService,
      ExplorationDiffService, ExplorationInitStateNameService,
      ExplorationLanguageCodeService, ExplorationObjectiveService,
      ExplorationRightsService, ExplorationStatesService,
      ExplorationTagsService,
      ExplorationTitleService, ExplorationWarningsService, FocusManagerService,
      RouterService, SiteAnalyticsService, StatesObjectFactory,
      UrlInterpolationService) {
    // Whether or not a save action is currently in progress
    // (request has been sent to backend but no reply received yet)
    var saveIsInProgress = false;

    // This flag is used to ensure only one save exploration modal can be open
    // at any one time.
    var modalIsOpen = false;

    var diffData = null;

    var isAdditionalMetadataNeeded = function() {
      return (
        !ExplorationTitleService.savedMemento ||
        !ExplorationObjectiveService.savedMemento ||
        !ExplorationCategoryService.savedMemento ||
        ExplorationLanguageCodeService.savedMemento ===
          constants.DEFAULT_LANGUAGE_CODE ||
        ExplorationTagsService.savedMemento.length === 0);
    };

    var areRequiredFieldsFilled = function() {
      if (!ExplorationTitleService.displayed) {
        AlertsService.addWarning('Please specify a title');
        return false;
      }
      if (!ExplorationObjectiveService.displayed) {
        AlertsService.addWarning('Please specify an objective');
        return false;
      }
      if (!ExplorationCategoryService.displayed) {
        AlertsService.addWarning('Please specify a category');
        return false;
      }

      return true;
    };

    var showCongratulatorySharingModal = function() {
      return $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/' +
          'post_publish_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$window', '$uibModalInstance',
          'ContextService',
          function(
              $scope, $window, $uibModalInstance,
              ContextService) {
            $scope.congratsImgUrl = UrlInterpolationService.getStaticImageUrl(
              '/general/congrats.svg');
            $scope.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = (
              GLOBALS.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR);
            $scope.close = function() {
              $uibModalInstance.dismiss('cancel');
            };
            $scope.explorationId = (
              ContextService.getExplorationId());
            $scope.explorationLink = (
              $window.location.protocol + '//' +
              $window.location.host + '/explore/' + $scope.explorationId);
            $scope.selectText = function(evt) {
              var codeDiv = evt.currentTarget;
              var range = document.createRange();
              range.setStartBefore(codeDiv.firstChild);
              range.setEndAfter(codeDiv.lastChild);
              var selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
            };
          }
        ]
      });
    };

    var openPublishExplorationModal = function(
        onStartSaveCallback, onSaveDoneCallback) {
      // This is resolved when modal is closed.
      var whenModalClosed = $q.defer();

      var publishModalInstance = $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/' +
          'exploration_publish_modal_directive.html'),
        backdrop: 'static',
        controller: [
          '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.publish = $uibModalInstance.close;

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      });

      publishModalInstance.result.then(function() {
        if (onStartSaveCallback) {
          onStartSaveCallback();
        }

        ExplorationRightsService.publish().then(
          function() {
            if (onSaveDoneCallback) {
              onSaveDoneCallback();
            }

            showCongratulatorySharingModal();
            SiteAnalyticsService.registerPublishExplorationEvent(
              ExplorationDataService.explorationId);
            whenModalClosed.resolve();
          });
      }, function() {
        AlertsService.clearWarnings();
        whenModalClosed.resolve();
      });

      return whenModalClosed.promise;
    };

    var saveDraftToBackend = function(commitMessage) {
      // Resolved when save is done
      // (regardless of success or failure of the operation).
      var whenSavingDone = $q.defer();

      var changeList = ChangeListService.getChangeList();

      if (ExplorationRightsService.isPrivate()) {
        SiteAnalyticsService.registerCommitChangesToPrivateExplorationEvent(
          ExplorationDataService.explorationId);
      } else {
        SiteAnalyticsService.registerCommitChangesToPublicExplorationEvent(
          ExplorationDataService.explorationId);
      }

      if (ExplorationWarningsService.countWarnings() === 0) {
        SiteAnalyticsService.registerSavePlayableExplorationEvent(
          ExplorationDataService.explorationId);
      }
      saveIsInProgress = true;

      ExplorationDataService.save(
        changeList, commitMessage,
        function(isDraftVersionValid, draftChanges) {
          if (isDraftVersionValid === false &&
              draftChanges !== null &&
              draftChanges.length > 0) {
            AutosaveInfoModalsService.showVersionMismatchModal(changeList);
            return;
          }
          $log.info('Changes to this exploration were saved successfully.');
          ChangeListService.discardAllChanges();
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
          ChangeListService.isExplorationLockedForEditing() &&
          !saveIsInProgress && (
            (ExplorationRightsService.isPrivate() &&
              !ExplorationWarningsService.hasCriticalWarnings()) ||
            (!ExplorationRightsService.isPrivate() &&
              ExplorationWarningsService.countWarnings() === 0)
          )
        );
      },

      discardChanges: function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'confirm_discard_changes_modal_directive.html'),
          backdrop: 'static',
          keyboard: false,
          controller: [
            '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.cancel = function() {
                $uibModalInstance.dismiss();
              };
              $scope.confirmDiscard = function() {
                $uibModalInstance.close();
              };
            }
          ]
        }).result.then(function() {
          AlertsService.clearWarnings();
          $rootScope.$broadcast('externalSave');

          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'editor_reloading_modal_directive.html'),
            backdrop: 'static',
            keyboard: false,
            controller: [
              '$scope', '$uibModalInstance',
              function($scope, $uibModalInstance) {
                $timeout(function() {
                  $uibModalInstance.dismiss('cancel');
                }, 2500);
              }
            ],
            windowClass: 'oppia-loading-modal'
          });

          ChangeListService.discardAllChanges();
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

        SiteAnalyticsService.registerOpenPublishExplorationModalEvent(
          ExplorationDataService.explorationId);
        AlertsService.clearWarnings();

        // If the metadata has not yet been specified, open the pre-publication
        // 'add exploration metadata' modal.
        if (isAdditionalMetadataNeeded()) {
          var modalInstance = $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'exploration_metadata_modal_directive.html'),
            backdrop: 'static',
            controller: [
              '$scope', '$uibModalInstance', 'ExplorationObjectiveService',
              'ExplorationTitleService', 'ExplorationCategoryService',
              'ExplorationStatesService', 'ALL_CATEGORIES',
              'ExplorationLanguageCodeService', 'ExplorationTagsService',
              function($scope, $uibModalInstance, ExplorationObjectiveService,
                  ExplorationTitleService, ExplorationCategoryService,
                  ExplorationStatesService, ALL_CATEGORIES,
                  ExplorationLanguageCodeService, ExplorationTagsService) {
                $scope.explorationTitleService = ExplorationTitleService;
                $scope.explorationObjectiveService =
                  ExplorationObjectiveService;
                $scope.explorationCategoryService =
                  ExplorationCategoryService;
                $scope.explorationLanguageCodeService = (
                  ExplorationLanguageCodeService);
                $scope.explorationTagsService = ExplorationTagsService;

                $scope.objectiveHasBeenPreviouslyEdited = (
                  ExplorationObjectiveService.savedMemento.length > 0);

                $scope.requireTitleToBeSpecified = (
                  !ExplorationTitleService.savedMemento);
                $scope.requireObjectiveToBeSpecified = (
                  ExplorationObjectiveService.savedMemento.length < 15);
                $scope.requireCategoryToBeSpecified = (
                  !ExplorationCategoryService.savedMemento);
                $scope.askForLanguageCheck = (
                  ExplorationLanguageCodeService.savedMemento ===
                  constants.DEFAULT_LANGUAGE_CODE);
                $scope.askForTags = (
                  ExplorationTagsService.savedMemento.length === 0);

                $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

                $scope.CATEGORY_LIST_FOR_SELECT2 = [];

                for (var i = 0; i < ALL_CATEGORIES.length; i++) {
                  $scope.CATEGORY_LIST_FOR_SELECT2.push({
                    id: ALL_CATEGORIES[i],
                    text: ALL_CATEGORIES[i]
                  });
                }

                if (ExplorationStatesService.isInitialized()) {
                  var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2
                    .some(
                      function(categoryItem) {
                        return categoryItem.id ===
                      ExplorationCategoryService.savedMemento;
                      }
                    );

                  // If the current category is not in the dropdown, add it
                  // as the first option.
                  if (!categoryIsInSelect2 &&
                      ExplorationCategoryService.savedMemento) {
                    $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
                      id: ExplorationCategoryService.savedMemento,
                      text: ExplorationCategoryService.savedMemento
                    });
                  }
                }

                $scope.isSavingAllowed = function() {
                  return Boolean(
                    ExplorationTitleService.displayed &&
                    ExplorationObjectiveService.displayed &&
                    ExplorationObjectiveService.displayed.length >= 15 &&
                    ExplorationCategoryService.displayed &&
                    ExplorationLanguageCodeService.displayed);
                };

                $scope.save = function() {
                  if (!areRequiredFieldsFilled()) {
                    return;
                  }

                  // Record any fields that have changed.
                  var metadataList = [];
                  if (ExplorationTitleService.hasChanged()) {
                    metadataList.push('title');
                  }
                  if (ExplorationObjectiveService.hasChanged()) {
                    metadataList.push('objective');
                  }
                  if (ExplorationCategoryService.hasChanged()) {
                    metadataList.push('category');
                  }
                  if (ExplorationLanguageCodeService.hasChanged()) {
                    metadataList.push('language');
                  }
                  if (ExplorationTagsService.hasChanged()) {
                    metadataList.push('tags');
                  }

                  // Save all the displayed values.
                  ExplorationTitleService.saveDisplayedValue();
                  ExplorationObjectiveService.saveDisplayedValue();
                  ExplorationCategoryService.saveDisplayedValue();
                  ExplorationLanguageCodeService.saveDisplayedValue();
                  ExplorationTagsService.saveDisplayedValue();

                  // TODO(sll): Get rid of the $timeout here.
                  // It's currently used because there is a race condition: the
                  // saveDisplayedValue() calls above result in autosave calls.
                  // These race with the discardDraft() call that
                  // will be called when the draft changes entered here
                  // are properly saved to the backend.
                  $timeout(function() {
                    $uibModalInstance.close(metadataList);
                  }, 500);
                };

                $scope.cancel = function() {
                  $uibModalInstance.dismiss('cancel');
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
          }, function() {
            whenModalsClosed.resolve();
            ExplorationTitleService.restoreFromMemento();
            ExplorationObjectiveService.restoreFromMemento();
            ExplorationCategoryService.restoreFromMemento();
            ExplorationLanguageCodeService.restoreFromMemento();
            ExplorationTagsService.restoreFromMemento();
            AlertsService.clearWarnings();
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

        if (!ExplorationRightsService.isPrivate() &&
            ExplorationWarningsService.countWarnings() > 0) {
          // If the exploration is not private, warnings should be fixed before
          // it can be saved.
          AlertsService.addWarning(ExplorationWarningsService.getWarnings()[0]);
          return;
        }

        ExplorationDataService.getLastSavedData().then(function(data) {
          var oldStates = StatesObjectFactory.createFromBackendDict(
            data.states).getStateObjects();
          var newStates = ExplorationStatesService.getStates()
            .getStateObjects();
          var diffGraphData = ExplorationDiffService.getDiffGraphData(
            oldStates, newStates, [{
              changeList: ChangeListService.getChangeList(),
              directionForwards: true
            }]);
          diffData = {
            nodes: diffGraphData.nodes,
            links: diffGraphData.links,
            finalStateIds: diffGraphData.finalStateIds,
            v1InitStateId: diffGraphData.originalStateIds[data.init_state_name],
            v2InitStateId: diffGraphData.stateIds[
              ExplorationInitStateNameService.displayed],
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

          var modalInstance = $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration_editor/' +
              'exploration_save_modal_directive.html'),
            backdrop: true,
            resolve: {
              isExplorationPrivate: function() {
                return ExplorationRightsService.isPrivate();
              },
              diffData: function() {
                return diffData;
              }
            },
            windowClass: 'oppia-save-exploration-modal',
            controller: [
              '$scope', '$uibModalInstance', 'isExplorationPrivate',
              function(
                  $scope, $uibModalInstance, isExplorationPrivate) {
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
                  $uibModalInstance.close(commitMessage);
                };
                $scope.cancel = function() {
                  $uibModalInstance.dismiss('cancel');
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
