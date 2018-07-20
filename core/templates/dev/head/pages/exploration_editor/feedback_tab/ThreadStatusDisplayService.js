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
 * @fileoverview Service that provides information about how to display the
 * status label for a thread in the feedback tab of the exploration editor.
 */

oppia.factory('ThreadStatusDisplayService', [function() {
  var _STATUS_CHOICES = [{
    id: 'open',
    text: 'Open'
  }, {
    id: 'fixed',
    text: 'Fixed'
  }, {
    id: 'ignored',
    text: 'Ignored'
  }, {
    id: 'compliment',
    text: 'Compliment'
  }, {
    id: 'not_actionable',
    text: 'Not Actionable'
  }, {
    id: 'received',
    text: 'open'
  }, {
    id: 'review',
    text: 'open'
  }, {
    id: 'accepted',
    text: 'Fixed'
  }, {
    id: 'rejected',
    text: 'Ignored'
  }];

  return {
    STATUS_CHOICES: angular.copy(_STATUS_CHOICES),
    getLabelClass: function(status) {
      if (status === 'open' || status === 'received' || status === 'review') {
        return 'label label-info';
      } else {
        return 'label label-default';
      }
    },
    getHumanReadableStatus: function(status) {
      for (var i = 0; i < _STATUS_CHOICES.length; i++) {
        if (_STATUS_CHOICES[i].id === status) {
          return _STATUS_CHOICES[i].text;
        }
      }
      return '';
    }
  };
}]);
