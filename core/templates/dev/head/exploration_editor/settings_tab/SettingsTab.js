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
 * @fileoverview Controllers for the exploration settings tab.
 */

oppia.controller('SettingsTab', [
  '$scope', '$http', '$window', '$modal', '$rootScope',
  'explorationData', 'explorationTitleService', 'explorationCategoryService',
  'explorationObjectiveService', 'explorationLanguageCodeService',
  'explorationTagsService', 'explorationRightsService',
  'explorationInitStateNameService', 'explorationParamSpecsService',
  'changeListService', 'alertsService', 'explorationStatesService',
  'explorationParamChangesService', 'explorationWarningsService',
  'CATEGORY_LIST', 'explorationAdvancedFeaturesService',
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  function(
      $scope, $http, $window, $modal, $rootScope,
      explorationData, explorationTitleService, explorationCategoryService,
      explorationObjectiveService, explorationLanguageCodeService,
      explorationTagsService, explorationRightsService,
      explorationInitStateNameService, explorationParamSpecsService,
      changeListService, alertsService, explorationStatesService,
      explorationParamChangesService, explorationWarningsService,
      CATEGORY_LIST, explorationAdvancedFeaturesService,
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL) {
    $scope.EXPLORATION_TITLE_INPUT_FOCUS_LABEL = (
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL);

    $scope.CATEGORY_LIST_FOR_SELECT2 = [];
    for (var i = 0; i < CATEGORY_LIST.length; i++) {
      $scope.CATEGORY_LIST_FOR_SELECT2.push({
        id: CATEGORY_LIST[i],
        text: CATEGORY_LIST[i]
      });
    }

    $scope.isRolesFormOpen = false;

    $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

    var DASHBOARD_PAGE_URL = '/dashboard';
    var EXPLORE_PAGE_PREFIX = '/explore/';

    $scope.getExplorePageUrl = function() {
      return (
        window.location.protocol + '//' + window.location.host +
        EXPLORE_PAGE_PREFIX + $scope.explorationId);
    };

    $scope.initSettingsTab = function() {
      $scope.explorationTitleService = explorationTitleService;
      $scope.explorationCategoryService = explorationCategoryService;
      $scope.explorationObjectiveService = explorationObjectiveService;
      $scope.explorationLanguageCodeService = explorationLanguageCodeService;
      $scope.explorationTagsService = explorationTagsService;
      $scope.explorationRightsService = explorationRightsService;
      $scope.explorationInitStateNameService = explorationInitStateNameService;
      $scope.explorationParamSpecsService = explorationParamSpecsService;
      $scope.explorationParamChangesService = explorationParamChangesService;

      explorationData.getData().then(function() {
        $scope.refreshSettingsTab();
        $scope.hasPageLoaded = true;
      });
    };

    $scope.refreshSettingsTab = function() {
      var _states = explorationStatesService.getStates();
      // Ensure that explorationStatesService has been initialized before
      // getting the state names from it. (Otherwise, navigating to the
      // settings tab directly (by entering a URL that ends with /settings)
      // results in a console error.
      if (_states) {
        var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2.some(
          function(categoryItem) {
            return categoryItem.id === explorationCategoryService.savedMemento;
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

        $scope.stateNames = Object.keys(_states);
      }
    };

    $scope.$on('refreshSettingsTab', $scope.refreshSettingsTab);

    $scope.initSettingsTab();

    $scope.ROLES = [{
      name: 'Manager (can edit permissions)',
      value: 'owner'
    }, {
      name: 'Collaborator (can make changes)',
      value: 'editor'
    }, {
      name: 'Playtester (can give feedback)',
      value: 'viewer'
    }];

    $scope.saveExplorationTitle = function() {
      explorationTitleService.saveDisplayedValue();
    };

    $scope.saveExplorationCategory = function() {
      explorationCategoryService.saveDisplayedValue();
    };

    $scope.saveExplorationObjective = function() {
      explorationObjectiveService.saveDisplayedValue();
    };

    $scope.saveExplorationLanguageCode = function() {
      explorationLanguageCodeService.saveDisplayedValue();
    };

    $scope.saveExplorationTags = function() {
      explorationTagsService.saveDisplayedValue();
    };

    $scope.saveExplorationInitStateName = function() {
      var newInitStateName = explorationInitStateNameService.displayed;

      if (!explorationStatesService.getState(newInitStateName)) {
        alertsService.addWarning(
          'Invalid initial state name: ' + newInitStateName);
        explorationInitStateNameService.restoreFromMemento();
        return;
      }

      explorationInitStateNameService.saveDisplayedValue();

      $rootScope.$broadcast('refreshGraph');
    };

    $scope.postSaveParamChangesHook = function() {
      explorationWarningsService.updateWarnings();
    };

    /********************************************
    * Methods for enabling advanced features.
    ********************************************/
    $scope.areParametersEnabled = (
      explorationAdvancedFeaturesService.areParametersEnabled);
    $scope.areGadgetsEnabled = (
      explorationAdvancedFeaturesService.areGadgetsEnabled);
    $scope.areFallbacksEnabled = (
      explorationAdvancedFeaturesService.areFallbacksEnabled);

    $scope.enableParameters = (
      explorationAdvancedFeaturesService.enableParameters);
    $scope.enableGadgets = (
      explorationAdvancedFeaturesService.enableGadgets);
    $scope.enableFallbacks = (
      explorationAdvancedFeaturesService.enableFallbacks);

    /********************************************
    * Methods for rights management.
    ********************************************/
    $scope.openEditRolesForm = function() {
      $scope.isRolesFormOpen = true;
      $scope.newMemberUsername = '';
      $scope.newMemberRole = $scope.ROLES[0];
    };

    $scope.closeEditRolesForm = function() {
      $scope.newMemberUsername = '';
      $scope.newMemberRole = $scope.ROLES[0];
      $scope.closeRolesForm();
    };

    $scope.editRole = function(newMemberUsername, newMemberRole) {
      $scope.closeRolesForm();
      explorationRightsService.saveChangeToBackend({
        new_member_username: newMemberUsername,
        new_member_role: newMemberRole
      });
    };

    $scope.toggleViewabilityIfPrivate = function() {
      explorationRightsService.saveChangeToBackend({
        viewable_if_private: !explorationRightsService.viewableIfPrivate()
      });
    };

    /********************************************
    * Methods relating to control buttons.
    ********************************************/
    $scope.showTransferExplorationOwnershipModal = function() {
      alertsService.clearWarnings();
      $modal.open({
        templateUrl: 'modals/transferExplorationOwnership',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.transfer = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        explorationRightsService.saveChangeToBackend({
          is_community_owned: true
        });
      });
    };

    $scope.deleteExploration = function(role) {
      alertsService.clearWarnings();

      $modal.open({
        templateUrl: 'modals/deleteExploration',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        var deleteUrl = $scope.explorationDataUrl;
        if (role) {
          deleteUrl += ('?role=' + role);
        }
        $http['delete'](deleteUrl).then(function() {
          $window.location = DASHBOARD_PAGE_URL;
        });
      });
    };

    var openModalForModeratorAction = function(action) {
      alertsService.clearWarnings();

      var moderatorEmailDraftUrl = '/moderatorhandler/email_draft/' + action;

      $http.get(moderatorEmailDraftUrl).then(function(response) {
        // If the draft email body is empty, email functionality will not be
        // exposed to the mdoerator.
        var draftEmailBody = response.data.draft_email_body;

        $modal.open({
          templateUrl: 'modals/takeModeratorAction',
          backdrop: true,
          resolve: {
            draftEmailBody: function() {
              return draftEmailBody;
            }
          },
          controller: [
              '$scope', '$modalInstance', 'draftEmailBody',
              function($scope, $modalInstance, draftEmailBody) {
            $scope.action = action;
            $scope.willEmailBeSent = Boolean(draftEmailBody);
            $scope.emailBody = draftEmailBody;

            if ($scope.willEmailBeSent) {
              $scope.EMAIL_BODY_SCHEMA = {
                type: 'unicode',
                ui_config: {
                  rows: 20
                }
              };
            }

            $scope.reallyTakeAction = function() {
              $modalInstance.close({
                emailBody: $scope.emailBody
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }]
        }).result.then(function(result) {
          explorationRightsService.saveModeratorChangeToBackend(
            action, result.emailBody);
        });
      });
    };

    $scope.unpublishExplorationAsModerator = function() {
      openModalForModeratorAction('unpublish_exploration');
    };

    $scope.publicizeExplorationAsModerator = function() {
      openModalForModeratorAction('publicize_exploration');
    };

    $scope.unpublicizeExplorationAsModerator = function() {
      // TODO(sll): Migrate this and deleteExplorationAsModerator to the
      // 'moderator action' path, and implement an option for different actions
      // saying whether emails should be sent for these, or not. At present,
      // we don't expect to send an email when an exploration is unpublicized.
      explorationRightsService.saveChangeToBackend({
        is_publicized: false
      });
    };

    $scope.isExplorationLockedForEditing = function() {
      return changeListService.isExplorationLockedForEditing();
    };

    $scope.closeRolesForm = function() {
      $scope.isRolesFormOpen = false;
    };
  }
]);
