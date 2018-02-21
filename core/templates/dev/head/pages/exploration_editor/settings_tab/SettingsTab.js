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
  '$scope', '$http', '$window', '$uibModal',
  '$rootScope', 'ExplorationDataService',
  'ExplorationTitleService', 'ExplorationCategoryService',
  'ExplorationObjectiveService', 'ExplorationLanguageCodeService',
  'ExplorationTagsService', 'ExplorationRightsService',
  'ExplorationInitStateNameService', 'ExplorationParamSpecsService',
  'ChangeListService', 'AlertsService', 'ExplorationStatesService',
  'ExplorationParamChangesService', 'ExplorationWarningsService',
  'ExplorationAdvancedFeaturesService', 'ALL_CATEGORIES',
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL', 'UserEmailPreferencesService',
  'EditableExplorationBackendApiService', 'UrlInterpolationService',
  'ExplorationAutomaticTextToSpeechService',
  'ExplorationCorrectnessFeedbackService',
  function(
      $scope, $http, $window, $uibModal,
      $rootScope, ExplorationDataService,
      ExplorationTitleService, ExplorationCategoryService,
      ExplorationObjectiveService, ExplorationLanguageCodeService,
      ExplorationTagsService, ExplorationRightsService,
      ExplorationInitStateNameService, ExplorationParamSpecsService,
      ChangeListService, AlertsService, ExplorationStatesService,
      ExplorationParamChangesService, ExplorationWarningsService,
      ExplorationAdvancedFeaturesService, ALL_CATEGORIES,
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL, UserEmailPreferencesService,
      EditableExplorationBackendApiService, UrlInterpolationService,
      ExplorationAutomaticTextToSpeechService,
      ExplorationCorrectnessFeedbackService) {
    $scope.EXPLORATION_TITLE_INPUT_FOCUS_LABEL = (
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL);

    $scope.CATEGORY_LIST_FOR_SELECT2 = [];
    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
      $scope.CATEGORY_LIST_FOR_SELECT2.push({
        id: ALL_CATEGORIES[i],
        text: ALL_CATEGORIES[i]
      });
    }

    $scope.isRolesFormOpen = false;

    $scope.TAG_REGEX = GLOBALS.TAG_REGEX;
    $scope.canDelete = GLOBALS.canDelete;
    $scope.canModifyRoles = GLOBALS.canModifyRoles;
    $scope.canReleaseOwnership = GLOBALS.canReleaseOwnership;
    $scope.canUnpublish = GLOBALS.canUnpublish;

    var CREATOR_DASHBOARD_PAGE_URL = '/creator_dashboard';
    var EXPLORE_PAGE_PREFIX = '/explore/';

    $scope.getExplorePageUrl = function() {
      return (
        window.location.protocol + '//' + window.location.host +
        EXPLORE_PAGE_PREFIX + $scope.explorationId);
    };

    $scope.initSettingsTab = function() {
      $scope.explorationTitleService = ExplorationTitleService;
      $scope.explorationCategoryService = ExplorationCategoryService;
      $scope.explorationObjectiveService = ExplorationObjectiveService;
      $scope.explorationLanguageCodeService = ExplorationLanguageCodeService;
      $scope.explorationTagsService = ExplorationTagsService;
      $scope.ExplorationRightsService = ExplorationRightsService;
      $scope.explorationInitStateNameService = ExplorationInitStateNameService;
      $scope.explorationParamSpecsService = ExplorationParamSpecsService;
      $scope.explorationParamChangesService = ExplorationParamChangesService;
      $scope.UserEmailPreferencesService = UserEmailPreferencesService;

      ExplorationDataService.getData().then(function() {
        $scope.refreshSettingsTab();
        $scope.hasPageLoaded = true;
      });
    };

    $scope.refreshSettingsTab = function() {
      // Ensure that ExplorationStatesService has been initialized before
      // getting the state names from it. (Otherwise, navigating to the
      // settings tab directly (by entering a URL that ends with /settings)
      // results in a console error.
      if (ExplorationStatesService.isInitialized()) {
        var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2.some(
          function(categoryItem) {
            return categoryItem.id === ExplorationCategoryService.savedMemento;
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

        $scope.stateNames = ExplorationStatesService.getStateNames();
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
      ExplorationTitleService.saveDisplayedValue();
    };

    $scope.saveExplorationCategory = function() {
      ExplorationCategoryService.saveDisplayedValue();
    };

    $scope.saveExplorationObjective = function() {
      ExplorationObjectiveService.saveDisplayedValue();
    };

    $scope.saveExplorationLanguageCode = function() {
      ExplorationLanguageCodeService.saveDisplayedValue();
    };

    $scope.saveExplorationTags = function() {
      ExplorationTagsService.saveDisplayedValue();
    };

    $scope.saveExplorationInitStateName = function() {
      var newInitStateName = ExplorationInitStateNameService.displayed;

      if (!ExplorationStatesService.getState(newInitStateName)) {
        AlertsService.addWarning(
          'Invalid initial state name: ' + newInitStateName);
        ExplorationInitStateNameService.restoreFromMemento();
        return;
      }

      ExplorationInitStateNameService.saveDisplayedValue();

      $rootScope.$broadcast('refreshGraph');
    };

    $scope.postSaveParamChangesHook = function() {
      ExplorationWarningsService.updateWarnings();
    };

    /********************************************
    * Methods for enabling advanced features.
    ********************************************/
    $scope.areParametersEnabled = (
      ExplorationAdvancedFeaturesService.areParametersEnabled);
    $scope.enableParameters = (
      ExplorationAdvancedFeaturesService.enableParameters);

    $scope.isAutomaticTextToSpeechEnabled = (
      ExplorationAutomaticTextToSpeechService.isAutomaticTextToSpeechEnabled);
    $scope.toggleAutomaticTextToSpeech = (
      ExplorationAutomaticTextToSpeechService.toggleAutomaticTextToSpeech);

    $scope.isCorrectnessFeedbackEnabled = (
      ExplorationCorrectnessFeedbackService.isEnabled);
    $scope.toggleCorrectnessFeedback = (
      ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback);

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
      ExplorationRightsService.saveRoleChanges(
        newMemberUsername, newMemberRole);
    };

    $scope.toggleViewabilityIfPrivate = function() {
      ExplorationRightsService.setViewability(
        !ExplorationRightsService.viewableIfPrivate());
    };

    /********************************************
    * Methods for notifications muting.
    ********************************************/

    $scope.muteFeedbackNotifications = function() {
      UserEmailPreferencesService.setFeedbackNotificationPreferences(true);
    };
    $scope.muteSuggestionNotifications = function() {
      UserEmailPreferencesService.setSuggestionNotificationPreferences(true);
    };

    $scope.unmuteFeedbackNotifications = function() {
      UserEmailPreferencesService.setFeedbackNotificationPreferences(false);
    };
    $scope.unmuteSuggestionNotifications = function() {
      UserEmailPreferencesService.setSuggestionNotificationPreferences(false);
    };

    /********************************************
    * Methods relating to control buttons.
    ********************************************/
    $scope.previewSummaryTile = function() {
      AlertsService.clearWarnings();
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'preview_summary_tile_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.getExplorationTitle = function() {
              return ExplorationTitleService.displayed;
            };
            $scope.getExplorationObjective = function() {
              return ExplorationObjectiveService.displayed;
            };
            $scope.getExplorationCategory = function() {
              return ExplorationCategoryService.displayed;
            };
            $scope.getThumbnailIconUrl = function() {
              var category = ExplorationCategoryService.displayed;
              if (constants.ALL_CATEGORIES.indexOf(category) === -1) {
                category = constants.DEFAULT_CATEGORY_ICON;
              }
              return '/subjects/' + category + '.svg';
            };
            $scope.getThumbnailBgColor = function() {
              var category = ExplorationCategoryService.displayed;
              if (!constants.CATEGORIES_TO_COLORS.hasOwnProperty(category)) {
                var color = constants.DEFAULT_COLOR;
              } else {
                var color = constants.CATEGORIES_TO_COLORS[category];
              }
              return color;
            };

            $scope.close = function() {
              $uibModalInstance.dismiss();
              AlertsService.clearWarnings();
            };
          }
        ]
      });
    };

    $scope.showTransferExplorationOwnershipModal = function() {
      AlertsService.clearWarnings();
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'transfer_exploration_ownership_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.transfer = $uibModalInstance.close;

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        ExplorationRightsService.makeCommunityOwned();
      });
    };

    $scope.deleteExploration = function() {
      AlertsService.clearWarnings();

      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'delete_exploration_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.reallyDelete = $uibModalInstance.close;

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        EditableExplorationBackendApiService.deleteExploration(
          $scope.explorationId).then(function() {
            $window.location = CREATOR_DASHBOARD_PAGE_URL;
          });
      });
    };

    $scope.unpublishExplorationAsModerator = function() {
      AlertsService.clearWarnings();

      var moderatorEmailDraftUrl = '/moderatorhandler/email_draft';

      $http.get(moderatorEmailDraftUrl).then(function(response) {
        // If the draft email body is empty, email functionality will not be
        // exposed to the mdoerator.
        var draftEmailBody = response.data.draft_email_body;

        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/settings_tab/' +
            'moderator_unpublish_exploration_modal_directive.html'),
          backdrop: true,
          resolve: {
            draftEmailBody: function() {
              return draftEmailBody;
            }
          },
          controller: [
            '$scope', '$uibModalInstance', 'draftEmailBody',
            function($scope, $uibModalInstance, draftEmailBody) {
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
                $uibModalInstance.close({
                  emailBody: $scope.emailBody
                });
              };

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(result) {
          ExplorationRightsService.saveModeratorChangeToBackend(
            result.emailBody);
        });
      });
    };

    $scope.isExplorationLockedForEditing = function() {
      return ChangeListService.isExplorationLockedForEditing();
    };

    $scope.closeRolesForm = function() {
      $scope.isRolesFormOpen = false;
    };
  }
]);
