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
 * @fileoverview Service for exploration saving & publication functionality.
 */

import { EventEmitter } from '@angular/core';
import { PostPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/post-publish-modal.component';
import { ExplorationPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/exploration-publish-modal.component';
import { EditorReloadingModalComponent } from 'pages/exploration-editor-page/modal-templates/editor-reloading-modal.component';
import { ConfirmDiscardChangesModalComponent } from 'pages/exploration-editor-page/modal-templates/confirm-discard-changes-modal.component';
import { ExplorationMetadataModalComponent } from '../modal-templates/exploration-metadata-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.component.ts');
require(
  'pages/exploration-editor-page/modal-templates/' +
  'exploration-save-modal.controller');
require('domain/exploration/StatesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/autosave-info-modals.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-diff.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-language-code.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-tags.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/site-analytics.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/external-save.service.ts');
require('services/editability.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').factory('ExplorationSaveService', [
  '$log', '$q', '$rootScope', '$timeout', '$uibModal', '$window',
  'AlertsService', 'AutosaveInfoModalsService', 'ChangeListService',
  'EditabilityService',
  'ExplorationCategoryService', 'ExplorationDataService',
  'ExplorationDiffService', 'ExplorationInitStateNameService',
  'ExplorationLanguageCodeService', 'ExplorationObjectiveService',
  'ExplorationRightsService', 'ExplorationStatesService',
  'ExplorationTagsService', 'ExplorationTitleService',
  'ExplorationWarningsService', 'ExternalSaveService',
  'FocusManagerService', 'NgbModal', 'RouterService',
  'SiteAnalyticsService', 'StatesObjectFactory',
  'DEFAULT_LANGUAGE_CODE',
  function(
      $log, $q, $rootScope, $timeout, $uibModal, $window,
      AlertsService, AutosaveInfoModalsService, ChangeListService,
      EditabilityService,
      ExplorationCategoryService, ExplorationDataService,
      ExplorationDiffService, ExplorationInitStateNameService,
      ExplorationLanguageCodeService, ExplorationObjectiveService,
      ExplorationRightsService, ExplorationStatesService,
      ExplorationTagsService, ExplorationTitleService,
      ExplorationWarningsService, ExternalSaveService,
      FocusManagerService, NgbModal, RouterService,
      SiteAnalyticsService, StatesObjectFactory,
      DEFAULT_LANGUAGE_CODE) {
    // Whether or not a save action is currently in progress
    // (request has been sent to backend but no reply received yet).
    var saveIsInProgress = false;

    // This flag is used to ensure only one save exploration modal can be open
    // at any one time.
    var modalIsOpen = false;

    var diffData = null;

    var _initExplorationPageEventEmitter = new EventEmitter();

    var isAdditionalMetadataNeeded = function() {
      return (
        !ExplorationTitleService.savedMemento ||
        !ExplorationObjectiveService.savedMemento ||
        !ExplorationCategoryService.savedMemento ||
        ExplorationLanguageCodeService.savedMemento ===
          DEFAULT_LANGUAGE_CODE ||
        ExplorationTagsService.savedMemento.length === 0);
    };

    var showCongratulatorySharingModal = function() {
      return NgbModal.open(PostPublishModalComponent, {
        backdrop: true
      }).result.then(function() {}, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    var openPublishExplorationModal = function(
        onStartSaveCallback, onSaveDoneCallback) {
      // This is resolved when modal is closed.
      var whenModalClosed = $q.defer();

      NgbModal.open(ExplorationPublishModalComponent, {
        backdrop: 'static',
      }).result.then(function() {
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
      EditabilityService.markNotEditable();

      ExplorationDataService.save(
        changeList, commitMessage,
        function(isDraftVersionValid, draftChanges) {
          if (isDraftVersionValid === false &&
              draftChanges !== null &&
              draftChanges.length > 0) {
            AutosaveInfoModalsService.showVersionMismatchModal(changeList);
            $rootScope.$applyAsync();
            return;
          }
          $log.info('Changes to this exploration were saved successfully.');
          ChangeListService.discardAllChanges().then(() => {
            _initExplorationPageEventEmitter.emit();
            RouterService.onRefreshVersionHistory.emit({
              forceRefresh: true
            });
            AlertsService.addSuccessMessage('Changes saved.', 5000);
            saveIsInProgress = false;
            EditabilityService.markEditable();
            whenSavingDone.resolve();
            $rootScope.$applyAsync();
          }, () => {
            EditabilityService.markEditable();
            whenSavingDone.resolve();
            $rootScope.$applyAsync();
          });
        }, function(errorResponse) {
          saveIsInProgress = false;
          whenSavingDone.resolve();
          EditabilityService.markEditable();
          const errorMessage = errorResponse.error.error;
          AlertsService.addWarning(
            'Error! Changes could not be saved - ' + errorMessage);
          $rootScope.$applyAsync();
        }
      );
      return whenSavingDone.promise;
    };

    return {
      isExplorationSaveable: function() {
        return (
          ChangeListService.isExplorationLockedForEditing() &&
          !saveIsInProgress && (
            (
              ExplorationRightsService.isPrivate() &&
              !ExplorationWarningsService.hasCriticalWarnings()) ||
            (
              !ExplorationRightsService.isPrivate() &&
              ExplorationWarningsService.countWarnings() === 0)
          )
        );
      },

      discardChanges: function() {
        NgbModal.open(ConfirmDiscardChangesModalComponent, {
          backdrop: 'static',
        }).result.then(function() {
          AlertsService.clearWarnings();
          ExternalSaveService.onExternalSave.emit();

          NgbModal.open(EditorReloadingModalComponent, {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'oppia-loading-modal'
          }).result.then(() => {}, () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });

          ChangeListService.discardAllChanges().then(() => {
            AlertsService.addSuccessMessage('Changes discarded.');
            _initExplorationPageEventEmitter.emit();

            // The reload is necessary because, otherwise, the
            // exploration-with-draft-changes will be reloaded
            // (since it is already cached in ExplorationDataService).
            $window.location.reload();
          });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
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
          var modalInstance = NgbModal.open(ExplorationMetadataModalComponent, {
            backdrop: 'static',
          });

          modalInstance.result.then((metadataList) => {
            if (metadataList.length > 0) {
              var commitMessage = (
                'Add metadata: ' + metadataList.join(', ') + '.');

              if (onStartLoadingCallback) {
                onStartLoadingCallback();
              }

              saveDraftToBackend(commitMessage).then(() => {
                if (onEndLoadingCallback) {
                  onEndLoadingCallback();
                }
                openPublishExplorationModal(
                  onStartLoadingCallback, onEndLoadingCallback)
                  .then(() => {
                    whenModalsClosed.resolve();
                  });
              });
            } else {
              openPublishExplorationModal(
                onStartLoadingCallback, onEndLoadingCallback)
                .then(() => {
                  whenModalsClosed.resolve();
                });
            }
          }, () => {
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
            .then(() => {
              whenModalsClosed.resolve();
            });
        }
        return whenModalsClosed.promise;
      },

      saveChangesAsync: async function(
          onStartLoadingCallback,
          onEndLoadingCallback
      ) {
        // This is marked as resolved after modal is closed, so we can change
        // controller 'saveIsInProgress' back to false.
        var whenModalClosed = $q.defer();

        RouterService.savePendingChanges();

        if (!ExplorationRightsService.isPrivate() &&
            ExplorationWarningsService.countWarnings() > 0) {
          // If the exploration is not private, warnings should be fixed before
          // it can be saved.
          AlertsService.addWarning(ExplorationWarningsService.getWarnings()[0]);
          return Promise.reject();
        }

        ExplorationDataService.getLastSavedDataAsync().then(function(data) {
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

          // TODO(wxy): After diff supports exploration metadata, add a check
          // to exit if changes cancel each other out.

          AlertsService.clearWarnings();

          // If the modal is open, do not open another one.
          if (modalIsOpen) {
            $rootScope.$applyAsync();
            return;
          }

          var modalInstance = $uibModal.open({
            template: require(
              'pages/exploration-editor-page/modal-templates/' +
              'exploration-save-modal.template.html'),
            backdrop: 'static',
            resolve: {
              isExplorationPrivate: function() {
                return ExplorationRightsService.isPrivate();
              },
              diffData: diffData
            },
            windowClass: 'oppia-save-exploration-modal',
            controller: 'ExplorationSaveModalController'
          });

          // Modal is Opened.
          modalIsOpen = true;

          modalInstance.opened.then(function() {
            // Toggle loading dots off after modal is opened.
            if (onEndLoadingCallback) {
              onEndLoadingCallback();
            }
            // The $timeout seems to be needed
            // in order to give the modal time to render.
            $timeout(function() {
              FocusManagerService.setFocus('saveChangesModalOpened');
            });
            $rootScope.$applyAsync();
          });

          modalInstance.result.then(function(commitMessage) {
            modalIsOpen = false;

            // Toggle loading dots back on for loading from backend.
            if (onStartLoadingCallback) {
              onStartLoadingCallback();
            }

            saveDraftToBackend(commitMessage).then(function() {
              whenModalClosed.resolve();
              $rootScope.$applyAsync();
            });
            $rootScope.$applyAsync();
          }, function() {
            AlertsService.clearWarnings();
            modalIsOpen = false;
            whenModalClosed.resolve();
            $rootScope.$applyAsync();
          });
        });
        $rootScope.$applyAsync();
        return whenModalClosed.promise;
      },

      get onInitExplorationPage() {
        return _initExplorationPageEventEmitter;
      }
    };
  }
]);
