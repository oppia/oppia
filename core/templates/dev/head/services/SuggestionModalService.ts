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
 * @fileoverview Service to handle common code for suggestion modal display.
 */

oppia.factory('SuggestionModalService', [function() {
  return {
    SUGGESTION_ACCEPTED_MSG: 'This suggestion has already been ' +
    'accepted.',
    SUGGESTION_REJECTED_MSG: 'This suggestion has already been ' +
    'rejected.',
    SUGGESTION_INVALID_MSG: 'This suggestion was made ' +
    'for a state that no longer exists. It cannot be accepted.',
    UNSAVED_CHANGES_MSG: 'You have unsaved changes to ' +
    'this exploration. Please save/discard your unsaved changes if ' +
    'you wish to accept.',
    ACTION_ACCEPT_SUGGESTION: 'accept',
    ACTION_REJECT_SUGGESTION: 'reject',
    ACTION_RESUBMIT_SUGGESTION: 'resubmit',
    SUGGESTION_ACCEPTED: 'accepted',
    SUGGESTION_REJECTED: 'rejected',

    acceptSuggestion: function($uibModalInstance, paramDict) {
      $uibModalInstance.close(paramDict);
    },

    rejectSuggestion: function($uibModalInstance, paramDict) {
      $uibModalInstance.close(paramDict);
    },

    cancelSuggestion: function($uibModalInstance) {
      $uibModalInstance.dismiss('cancel');
    },
  };
}]);
