// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to display suggestion modal in learner local view.
 */

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'pages/exploration-player-page/templates/' +
  'exploration-player-suggestion-modal.controller.ts');

require('services/alerts.service.ts');

angular.module('oppia').factory('SuggestionModalForExplorationPlayerService', [
  '$http', '$uibModal', 'AlertsService',
  function($http, $uibModal, AlertsService) {
    var _showEditStateContentSuggestionModal = function() {
      $uibModal.open({
        template: require(
          'pages/exploration-player-page/templates/' +
          'exploration-player-suggestion-modal.directive.html'),
        backdrop: 'static',
        controller: 'ExplorationPlayerSuggestionModalController'
      }).result.then(function(result) {
        var data = {
          suggestion_type: result.suggestion_type,
          target_type: result.target_type,
          target_id: result.target_id,
          target_version_at_submission: result.version,
          assigned_reviewer_id: null,
          final_reviewer_id: null,
          description: result.description,
          change: {
            cmd: 'edit_state_property',
            property_name: 'content',
            state_name: result.stateName,
            new_value: {
              html: result.suggestionHtml
            }
          }
        };
        var url = '/suggestionhandler/';

        $http.post(url, data).then(null, function(res) {
          AlertsService.addWarning(res);
        });
        $uibModal.open({
          template: require(
            'pages/exploration-player-page/templates/' +
            'learner-suggestion-submitted-modal.template.html'),
          backdrop: true,
          controller: 'ConfirmOrCancelModalController'
        }).result.then(function() {}, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      }, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal();
        }
      }
    };
  }
]);
