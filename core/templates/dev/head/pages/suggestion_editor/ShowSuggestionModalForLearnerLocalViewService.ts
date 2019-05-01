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

oppia.factory('ShowSuggestionModalForLearnerLocalViewService', [
  '$http', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($http, $uibModal, AlertsService, UrlInterpolationService) {
    var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/suggestion_editor/' +
      'learner_local_view_suggestion_modal_directive.html'
    );

    var _showEditStateContentSuggestionModal = function() {
      $uibModal.open({
        templateUrl: _templateUrl,
        backdrop: 'static',
        resolve: {},
        controller: 'ShowSuggestionModalForLearnerLocalView',
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

        $http.post(url, data).error(function(res) {
          AlertsService.addWarning(res);
        });
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'learner_suggestion_submitted_modal_directive.html'),
          backdrop: true,
          resolve: {},
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.close = function() {
                $uibModalInstance.dismiss();
              };
            }
          ]
        });
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
