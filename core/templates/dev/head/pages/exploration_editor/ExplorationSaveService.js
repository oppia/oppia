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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */

oppia.factory('explorationSaveService', [
  '$http', '$modal', '$timeout', '$rootScope', '$window', '$log',
  'alertsService', 'explorationData',
  'explorationTagsService', 'explorationTitleService',
  'explorationObjectiveService', 'explorationCategoryService',
  'explorationLanguageCodeService', 'explorationRightsService',
  'explorationWarningsService',
  'changeListService', 'siteAnalyticsService',
  function(
      $http, $modal, $timeout, $rootScope, $window, $log,
      alertsService, explorationData,
      explorationTagsService, explorationTitleService,
      explorationObjectiveService, explorationCategoryService,
      explorationLanguageCodeService, explorationRightsService,
      explorationWarningsService,
      changeListService, siteAnalyticsService) {
    // Whether or not a save action is currently in progress.
    var saveInProgress = false;
    // Whether or not a discard action is currently in progress.
    var discardInPrograss = false;
    // The last 'save' or 'discard' action. Can be null (no such action has
    // been performed yet), 'save' (the last action was a save) or 'discard'
    // (the last action was a discard).
    var lastSaveOrDiscardAction = null;

    return {

      isSaveInProgress: function() {
        return saveInProgress;
      },

      isExplorationSaveable: function() {
        return (
          changeListService.isExplorationLockedForEditing() &&
          !saveInProgress && (
            (explorationRightsService.isPrivate() &&
              !explorationWarningsService.hasCriticalWarnings()) ||
            (!explorationRightsService.isPrivate() &&
              explorationWarningsService.countWarnings() === 0)
          )
        );
      },

      discardChanges: function() {
        var confirmDiscard = confirm(
          'Are you sure you want to discard your changes?');

        if (confirmDiscard) {
          alertsService.clearWarnings();
          $rootScope.$broadcast('externalSave');

          changeListService.discardAllChanges();
          alertsService.addSuccessMessage('Changes discarded.');
          $rootScope.$broadcast('initExplorationPage');

          // The reload is necessary because, otherwise, the
          // exploration-with-draft-changes will be reloaded
          // (since it is already cached in explorationData).
          location.reload();
        }
      },

      showCongratulatorySharingModal: function() {
        return $modal.open({
          templateUrl: 'modals/shareExplorationAfterPublish',
          backdrop: true,
          controller: [
            '$scope', '$modalInstance', 'explorationContextService',
            'UrlInterpolationService',
            function($scope, $modalInstance, explorationContextService,
              UrlInterpolationService) {
              $scope.congratsImgUrl = UrlInterpolationService.getStaticImageUrl(
                '/general/congrats.svg');
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
      },

      saveDraftToBackend: function(commitMessage, successCallback) {
        var changeList = changeListService.getChangeList();

        if (explorationRightsService.isPrivate()) {
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
        saveInProgress = true;

        explorationData.save(
          changeList, commitMessage, function(isDraftVersionValid, draftChanges) {
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
            saveInProgress = false;
            if (successCallback) {
              successCallback();
            }
          }, function() {
            saveInProgress = false;
          }
        );
      },

      openPublishExplorationModal: function() {
        return $modal.open({
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
      },

      isAdditionalMetadataNeeded: function() {
        return (
          !explorationTitleService.savedMemento ||
          !explorationObjectiveService.savedMemento ||
          !explorationCategoryService.savedMemento ||
          explorationLanguageCodeService.savedMemento ===
            GLOBALS.DEFAULT_LANGUAGE_CODE ||
          explorationTagsService.savedMemento.length === 0);
      },

      isSavingAllowed: function() {
        return Boolean(
          explorationTitleService.displayed &&
          explorationObjectiveService.displayed &&
          explorationObjectiveService.displayed.length >= 15 &&
          explorationCategoryService.displayed &&
          explorationLanguageCodeService.displayed);
      },

      requiredFieldsFilled: function() {
        if (!explorationTitleService.displayed) {
          alertsService.addWarning('Please specify a title');
          return false;
        }
        if (!explorationObjectiveService.displayed) {
          alertsService.addWarning('Please specify an objective');
          return false;
        }
        if (!explorationCategoryService.displayed) {
          alertsService.addWarning('Please specify a category');
          return false;
        }

        return true;
      },

      save: function() {
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

        return metadataList;
      },

      cancel: function() {
        explorationTitleService.restoreFromMemento();
        explorationObjectiveService.restoreFromMemento();
        explorationCategoryService.restoreFromMemento();
        explorationLanguageCodeService.restoreFromMemento();
        explorationTagsService.restoreFromMemento();

        $modalInstance.dismiss('cancel');
        alertsService.clearWarnings();
      }
    };
  }
]);
