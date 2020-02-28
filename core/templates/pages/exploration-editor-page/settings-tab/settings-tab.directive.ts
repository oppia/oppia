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
 * @fileoverview Directive for the exploration settings tab.
 */

require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.directive.ts');
require(
  'pages/exploration-editor-page/exploration-objective-editor/' +
  'exploration-objective-editor.directive.ts');
require(
  'pages/exploration-editor-page/param-changes-editor/' +
  'param-changes-editor.directive.ts');

require('domain/exploration/editable-exploration-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-automatic-text-to-speech.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-correctness-feedback.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/exploration-editor-page.controller.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-language-code.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-param-changes.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-param-specs.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-tags.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require(
  'pages/exploration-editor-page/services/user-email-preferences.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('services/alerts.service.ts');
require('services/editability.service.ts');
require('services/exploration-features.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('settingsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        currentUserIsAdmin: '=',
        currentUserIsModerator: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/settings-tab/' +
        'settings-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', '$scope', '$uibModal', '$window',
        'AlertsService', 'ChangeListService',
        'EditabilityService', 'EditableExplorationBackendApiService',
        'ExplorationAutomaticTextToSpeechService',
        'ExplorationCategoryService', 'ExplorationCorrectnessFeedbackService',
        'ExplorationDataService', 'ExplorationFeaturesService',
        'ExplorationInitStateNameService', 'ExplorationLanguageCodeService',
        'ExplorationObjectiveService', 'ExplorationParamChangesService',
        'ExplorationParamSpecsService', 'ExplorationRightsService',
        'ExplorationStatesService', 'ExplorationTagsService',
        'ExplorationTitleService', 'ExplorationWarningsService',
        'UrlInterpolationService', 'UserEmailPreferencesService',
        'UserExplorationPermissionsService', 'ALL_CATEGORIES',
        'CATEGORIES_TO_COLORS', 'DEFAULT_CATEGORY_ICON', 'DEFAULT_COLOR',
        'EXPLORATION_TITLE_INPUT_FOCUS_LABEL', 'TAG_REGEX',
        function(
            $http, $rootScope, $scope, $uibModal, $window,
            AlertsService, ChangeListService,
            EditabilityService, EditableExplorationBackendApiService,
            ExplorationAutomaticTextToSpeechService,
            ExplorationCategoryService, ExplorationCorrectnessFeedbackService,
            ExplorationDataService, ExplorationFeaturesService,
            ExplorationInitStateNameService, ExplorationLanguageCodeService,
            ExplorationObjectiveService, ExplorationParamChangesService,
            ExplorationParamSpecsService, ExplorationRightsService,
            ExplorationStatesService, ExplorationTagsService,
            ExplorationTitleService, ExplorationWarningsService,
            UrlInterpolationService, UserEmailPreferencesService,
            UserExplorationPermissionsService, ALL_CATEGORIES,
            CATEGORIES_TO_COLORS, DEFAULT_CATEGORY_ICON, DEFAULT_COLOR,
            EXPLORATION_TITLE_INPUT_FOCUS_LABEL, TAG_REGEX) {
          var ctrl = this;

          var CREATOR_DASHBOARD_PAGE_URL = '/creator_dashboard';
          var EXPLORE_PAGE_PREFIX = '/explore/';

          ctrl.getExplorePageUrl = function() {
            return (
              window.location.protocol + '//' + window.location.host +
              EXPLORE_PAGE_PREFIX + ctrl.explorationId);
          };

          ctrl.refreshSettingsTab = function() {
            // Ensure that ExplorationStatesService has been initialized before
            // getting the state names from it. Otherwise, navigating to the
            // settings tab directly (by entering a URL that ends with
            // /settings) results in a console error.

            ctrl.hasPageLoaded = false;
            ExplorationDataService.getData().then(function() {
              if (ExplorationStatesService.isInitialized()) {
                var categoryIsInSelect2 = ctrl.CATEGORY_LIST_FOR_SELECT2.some(
                  function(categoryItem) {
                    return (
                      categoryItem.id ===
                          ExplorationCategoryService.savedMemento);
                  }
                );
                // If the current category is not in the dropdown, add it
                // as the first option.
                if (!categoryIsInSelect2 &&
                    ExplorationCategoryService.savedMemento) {
                  ctrl.CATEGORY_LIST_FOR_SELECT2.unshift({
                    id: ExplorationCategoryService.savedMemento,
                    text: ExplorationCategoryService.savedMemento
                  });
                }

                ctrl.stateNames = ExplorationStatesService.getStateNames();
              }
              ctrl.hasPageLoaded = true;
            });
          };

          ctrl.saveExplorationTitle = function() {
            ExplorationTitleService.saveDisplayedValue();
          };

          ctrl.saveExplorationCategory = function() {
            ExplorationCategoryService.saveDisplayedValue();
          };

          ctrl.saveExplorationObjective = function() {
            ExplorationObjectiveService.saveDisplayedValue();
          };

          ctrl.saveExplorationLanguageCode = function() {
            ExplorationLanguageCodeService.saveDisplayedValue();
          };

          ctrl.saveExplorationTags = function() {
            ExplorationTagsService.saveDisplayedValue();
          };

          ctrl.saveExplorationInitStateName = function() {
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

          ctrl.postSaveParamChangesHook = function() {
            ExplorationWarningsService.updateWarnings();
          };

          // Methods for enabling advanced features.
          ctrl.areParametersEnabled = function() {
            return ExplorationFeaturesService.areParametersEnabled();
          };
          ctrl.enableParameters = function() {
            ExplorationFeaturesService.enableParameters();
          };

          ctrl.isAutomaticTextToSpeechEnabled = function() {
            return ExplorationAutomaticTextToSpeechService
              .isAutomaticTextToSpeechEnabled();
          };
          ctrl.toggleAutomaticTextToSpeech = function() {
            return ExplorationAutomaticTextToSpeechService
              .toggleAutomaticTextToSpeech();
          };

          ctrl.isCorrectnessFeedbackEnabled = function() {
            return ExplorationCorrectnessFeedbackService.isEnabled();
          };
          ctrl.toggleCorrectnessFeedback = function() {
            ExplorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
          };

          // Methods for rights management.
          ctrl.openEditRolesForm = function() {
            ctrl.isRolesFormOpen = true;
            ctrl.newMemberUsername = '';
            ctrl.newMemberRole = ctrl.ROLES[0];
          };

          ctrl.closeEditRolesForm = function() {
            ctrl.newMemberUsername = '';
            ctrl.newMemberRole = ctrl.ROLES[0];
            ctrl.closeRolesForm();
          };

          ctrl.editRole = function(newMemberUsername, newMemberRole) {
            ctrl.closeRolesForm();
            ExplorationRightsService.saveRoleChanges(
              newMemberUsername, newMemberRole);
          };

          ctrl.toggleViewabilityIfPrivate = function() {
            ExplorationRightsService.setViewability(
              !ExplorationRightsService.viewableIfPrivate());
          };

          // Methods for muting notifications.
          ctrl.muteFeedbackNotifications = function() {
            UserEmailPreferencesService.setFeedbackNotificationPreferences(
              true);
          };
          ctrl.muteSuggestionNotifications = function() {
            UserEmailPreferencesService.setSuggestionNotificationPreferences(
              true
            );
          };

          ctrl.unmuteFeedbackNotifications = function() {
            UserEmailPreferencesService.setFeedbackNotificationPreferences(
              false
            );
          };
          ctrl.unmuteSuggestionNotifications = function() {
            UserEmailPreferencesService.setSuggestionNotificationPreferences(
              false);
          };

          // Methods relating to control buttons.
          ctrl.previewSummaryTile = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/settings-tab/templates/' +
                'preview-summary-tile-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
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
                    if (ALL_CATEGORIES.indexOf(category) === -1) {
                      category = DEFAULT_CATEGORY_ICON;
                    }
                    return '/subjects/' + category + '.svg';
                  };
                  $scope.getThumbnailBgColor = function() {
                    var category = ExplorationCategoryService.displayed;
                    var color = null;
                    if (!CATEGORIES_TO_COLORS.hasOwnProperty(category)) {
                      color = DEFAULT_COLOR;
                    } else {
                      color = CATEGORIES_TO_COLORS[category];
                    }
                    return color;
                  };

                  $scope.close = function() {
                    $uibModalInstance.dismiss();
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {}, function() {
              // Note to developers:
              // Promise is returned by getCurrentUrl which is handled here.
              // No further action is needed.
            });
          };

          ctrl.showTransferExplorationOwnershipModal = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/settings-tab/templates/' +
                'transfer-exploration-ownership-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
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

          ctrl.deleteExploration = function() {
            AlertsService.clearWarnings();

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/settings-tab/templates/' +
                'delete-exploration-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
                  $scope.reallyDelete = $uibModalInstance.close;

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {
              EditableExplorationBackendApiService.deleteExploration(
                ctrl.explorationId).then(function() {
                $window.location = CREATOR_DASHBOARD_PAGE_URL;
              });
            }, function() {
              // Note to developers:
              // Promise is returned by uimodal which is handled here.
              // No further action is needed.
            });
          };

          ctrl.unpublishExplorationAsModerator = function() {
            AlertsService.clearWarnings();

            var moderatorEmailDraftUrl = '/moderatorhandler/email_draft';

            $http.get(moderatorEmailDraftUrl).then(function(response) {
              // If the draft email body is empty, email functionality will not
              // be exposed to the mdoerator.
              var draftEmailBody = response.data.draft_email_body;

              $uibModal.open({
                bindToController: {},
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/exploration-editor-page/settings-tab/templates/' +
                  'moderator-unpublish-exploration-modal.template.html'),
                backdrop: true,
                resolve: {
                  draftEmailBody: function() {
                    return draftEmailBody;
                  }
                },
                controllerAs: '$ctrl',
                controller: [
                  '$uibModalInstance', 'draftEmailBody',
                  function($uibModalInstance, draftEmailBody) {
                    var ctrl = this;
                    ctrl.willEmailBeSent = Boolean(draftEmailBody);
                    ctrl.emailBody = draftEmailBody;

                    if (ctrl.willEmailBeSent) {
                      ctrl.EMAIL_BODY_SCHEMA = {
                        type: 'unicode',
                        ui_config: {
                          rows: 20
                        }
                      };
                    }

                    ctrl.reallyTakeAction = function() {
                      $uibModalInstance.close({
                        emailBody: ctrl.emailBody
                      });
                    };

                    ctrl.cancel = function() {
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

          ctrl.isExplorationLockedForEditing = function() {
            return ChangeListService.isExplorationLockedForEditing();
          };

          ctrl.closeRolesForm = function() {
            ctrl.isRolesFormOpen = false;
          };

          ctrl.isTitlePresent = function() {
            return ExplorationTitleService.savedMemento.length > 0;
          };

          ctrl.$onInit = function() {
            $scope.$on('refreshSettingsTab', ctrl.refreshSettingsTab);
            ctrl.EXPLORATION_TITLE_INPUT_FOCUS_LABEL = (
              EXPLORATION_TITLE_INPUT_FOCUS_LABEL);
            ctrl.EditabilityService = EditabilityService;
            ctrl.CATEGORY_LIST_FOR_SELECT2 = [];
            for (var i = 0; i < ALL_CATEGORIES.length; i++) {
              ctrl.CATEGORY_LIST_FOR_SELECT2.push({
                id: ALL_CATEGORIES[i],
                text: ALL_CATEGORIES[i]
              });
            }

            ctrl.isRolesFormOpen = false;

            ctrl.TAG_REGEX = TAG_REGEX;
            ctrl.canDelete = false;
            ctrl.canModifyRoles = false;
            ctrl.canReleaseOwnership = false;
            ctrl.canUnpublish = false;
            ctrl.explorationId = ExplorationDataService.explorationId;

            UserExplorationPermissionsService.getPermissionsAsync()
              .then(function(permissions) {
                ctrl.canDelete = permissions.can_delete;
                ctrl.canModifyRoles = permissions.can_modify_roles;
                ctrl.canReleaseOwnership = permissions.can_release_ownership;
                ctrl.canUnpublish = permissions.can_unpublish;
              });

            ctrl.explorationTitleService = ExplorationTitleService;
            ctrl.explorationCategoryService = ExplorationCategoryService;
            ctrl.explorationObjectiveService = ExplorationObjectiveService;
            ctrl.explorationLanguageCodeService = (
              ExplorationLanguageCodeService);
            ctrl.explorationTagsService = ExplorationTagsService;
            ctrl.ExplorationRightsService = ExplorationRightsService;
            ctrl.explorationInitStateNameService = (
              ExplorationInitStateNameService);
            ctrl.explorationParamSpecsService = ExplorationParamSpecsService;
            ctrl.explorationParamChangesService = (
              ExplorationParamChangesService);
            ctrl.UserEmailPreferencesService = UserEmailPreferencesService;

            ctrl.refreshSettingsTab();

            ctrl.ROLES = [{
              name: 'Manager (can edit permissions)',
              value: 'owner'
            }, {
              name: 'Collaborator (can make changes)',
              value: 'editor'
            }, {
              name: 'Voice Artist (can do voiceover)',
              value: 'voice artist'
            }, {
              name: 'Playtester (can give feedback)',
              value: 'viewer'
            }];

            ctrl.formStyle = JSON.stringify({
              display: 'table-cell',
              width: '16.66666667%',
              'vertical-align': 'top'
            });
          };
        }
      ]};
  }]);
