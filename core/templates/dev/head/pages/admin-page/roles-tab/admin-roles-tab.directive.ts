// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Roles tab in the admin panel.
 */

require('pages/admin-page/roles-tab/role-graph.directive.ts');

require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminRolesTab', [
  '$http', '$rootScope', 'AdminDataService', 'AdminTaskManagerService',
  'LanguageUtilService', 'UrlInterpolationService', 'ADMIN_ROLE_HANDLER_URL',
  'REVIEWABLE_ITEM_QUESTION', 'REVIEWABLE_ITEM_TRANSLATION',
  'REVIEWABLE_ITEM_VOICEOVER',
  function(
      $http, $rootScope, AdminDataService, AdminTaskManagerService,
      LanguageUtilService, UrlInterpolationService, ADMIN_ROLE_HANDLER_URL,
      REVIEWABLE_ITEM_QUESTION, REVIEWABLE_ITEM_TRANSLATION,
      REVIEWABLE_ITEM_VOICEOVER) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/role-graph.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;

        var errorHandler = function(errorResponse) {
          ctrl.setStatusMessage(
            'Server error: ' + errorResponse.data.error);
        };

        ctrl.submitRoleViewForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          ctrl.setStatusMessage('Processing query...');

          AdminTaskManagerService.startTask();
          ctrl.result = {};
          $http.get(ADMIN_ROLE_HANDLER_URL, {
            params: {
              method: values.method,
              role: values.role,
              username: values.username
            }
          }).then(function(response) {
            ctrl.result = response.data;
            if (Object.keys(ctrl.result).length === 0) {
              ctrl.resultRolesVisible = false;
              ctrl.setStatusMessage('No results.');
            } else {
              ctrl.resultRolesVisible = true;
              ctrl.setStatusMessage('Success.');
            }
            refreshFormData();
          }, errorHandler);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitUpdateRoleForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Updating User Role');
          AdminTaskManagerService.startTask();
          $http.post(ADMIN_ROLE_HANDLER_URL, {
            role: values.newRole,
            username: values.username,
            topic_id: values.topicId
          }).then(function(response) {
            ctrl.setStatusMessage(
              'Role of ' + values.username + ' successfully updated to ' +
              values.newRole);
            refreshFormData();
          }, errorHandler);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitAddCommunityReviewerForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Adding new reviewer...');
          AdminTaskManagerService.startTask();
          $http.post('/addcommunityreviewerhandler', {
            review_item: values.type,
            username: values.username,
            language_code: values.languageCode
          }).then(function(response) {
            ctrl.setStatusMessage(
              'Successfully added "' + values.username + '" as ' +
              values.type + ' reviewer.');
            refreshFormData();
          }, errorHandler);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitViewCommunityReviewersForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Processing query...');
          AdminTaskManagerService.startTask();
          $http.get(
            '/getcommunityreviewershandler', {
              params: {
                method: values.method,
                username: values.username,
                type: values.type,
                language_code: values.languageCode
              }
            }).then(function(response) {
            if (values.method === 'role') {
              ctrl.result.usernames = response.data.usernames;
            } else {
              var translationLanguages = [];
              var voiceoverLanguages = [];
              response.data.can_review_translation_for_language_codes.forEach(
                function(languageCode) {
                  translationLanguages.push(
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode));
                });
              response.data.can_review_voiceover_for_language_codes.forEach(
                function(languageCode) {
                  voiceoverLanguages.push(
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode));
                });
              ctrl.result = {
                translationLanguages: translationLanguages,
                voiceoverLanguages: voiceoverLanguages,
                questions: response.data.can_review_questions
              };
            }
            ctrl.communityReviewersDataFetched = true;
            ctrl.setStatusMessage('Success.');
          }, errorHandler);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitRemoveCommunityReviewerForm = function(values) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Processing query...');
          AdminTaskManagerService.startTask();
          $http.put(
            '/removecommunityreviewerhandler', {
              username: values.username,
              removal_type: values.method,
              review_type: values.type,
              language_code: values.languageCode
            }).then(function(response) {
            ctrl.setStatusMessage('Success.');
            refreshFormData();
          }, errorHandler);
          AdminTaskManagerService.finishTask();
        };

        var refreshFormData = function() {
          ctrl.formData = {
            viewUserRoles: {
              method: 'role',
              role: null,
              username: ''
            },
            updateRole: {
              newRole: null,
              username: '',
              topicId: null
            },
            viewCommunityReviewers: {
              method: 'role',
              username: '',
              type: '',
              languageCode: null
            },
            addCommunityReviewer: {
              username: '',
              type: null,
              languageCode: null
            },
            removeCommunityReviewer: {
              username: '',
              method: 'all',
              type: null,
              languageCode: null
            }
          };
        };

        ctrl.$onInit = function() {
          refreshFormData();
          ctrl.resultRolesVisible = false;
          ctrl.communityReviewersDataFetched = false;
          ctrl.result = {};
          ctrl.setStatusMessage('');

          ctrl.UPDATABLE_ROLES = {};
          ctrl.VIEWABLE_ROLES = {};
          ctrl.REVIEWABLE_ITEMS = {
            TRANSLATION: REVIEWABLE_ITEM_TRANSLATION,
            VOICEOVER: REVIEWABLE_ITEM_VOICEOVER,
            QUESTION: REVIEWABLE_ITEM_QUESTION
          };
          ctrl.languageCodesAndDescriptions = (
            LanguageUtilService.getAllVoiceoverLanguageCodes().map(
              function(languageCode) {
                return {
                  id: languageCode,
                  description: (
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode))
                };
              }));
          ctrl.topicSummaries = {};
          ctrl.graphData = {};
          ctrl.graphDataLoaded = false;
          AdminDataService.getDataAsync().then(function(response) {
            ctrl.UPDATABLE_ROLES = response.updatable_roles;
            ctrl.VIEWABLE_ROLES = response.viewable_roles;
            ctrl.topicSummaries = response.topic_summaries;
            ctrl.graphData = response.role_graph_data;

            ctrl.graphDataLoaded = false;
            // Calculating initStateId and finalStateIds for graphData
            // Since role graph is acyclic, node with no incoming edge
            // is initState and nodes with no outgoing edge are finalStates.
            var hasIncomingEdge = [];
            var hasOutgoingEdge = [];
            for (var i = 0; i < ctrl.graphData.links.length; i++) {
              hasIncomingEdge.push(ctrl.graphData.links[i].target);
              hasOutgoingEdge.push(ctrl.graphData.links[i].source);
            }
            var finalStateIds = [];
            for (var role in ctrl.graphData.nodes) {
              if (ctrl.graphData.nodes.hasOwnProperty(role)) {
                if (hasIncomingEdge.indexOf(role) === -1) {
                  ctrl.graphData.initStateId = role;
                }
                if (hasOutgoingEdge.indexOf(role) === -1) {
                  finalStateIds.push(role);
                }
              }
            }
            ctrl.graphData.finalStateIds = finalStateIds;
            ctrl.graphDataLoaded = true;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular
            $rootScope.$apply();
          });
        };
      }]
    };
  }
]);
