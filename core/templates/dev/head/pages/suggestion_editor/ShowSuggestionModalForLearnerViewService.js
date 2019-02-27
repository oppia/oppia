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
 * @fileoverview Service to display suggestion modal in learner view.
 */

oppia.factory('ShowSuggestionModalForLearnerViewService', [
  '$rootScope', '$uibModal',
  'UrlInterpolationService',
  function($rootScope, $uibModal,
      UrlInterpolationService) {
    var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/suggestion_editor/' +
      'learner_view_suggestion_modal_directive.html'
    );

    var _showEditStateContentSuggestionModal = function(
        newContent, oldContent, description) {
      $uibModal.open({
        templateUrl: _templateUrl,
        backdrop: true,
        resolve: {
          newContent: function() {
            return newContent;
          },
          oldContent: function() {
            return oldContent;
          },
          description: function() {
            return description;
          }
        },
        controller: 'ShowSuggestionModalForLearnerView'
      });
    };

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal(
            extraParams.newContent,
            extraParams.oldContent,
            extraParams.description
          );
        }
      }
    };
  }
]);
