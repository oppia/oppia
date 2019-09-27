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
 * @fileoverview Service that provides information about how to display the
 * tasks and data in the improvements tab of the exploration editor.
 */

require('pages/exploration-editor-page/exploration-editor-page.constants.ts');

angular.module('oppia').factory('ImprovementsDisplayService', [
  'STATUS_COMPLIMENT', 'STATUS_FIXED', 'STATUS_IGNORED',
  'STATUS_NOT_ACTIONABLE', 'STATUS_OPEN',
  function(
      STATUS_COMPLIMENT, STATUS_FIXED, STATUS_IGNORED,
      STATUS_NOT_ACTIONABLE, STATUS_OPEN) {
    var STATUS_CHOICES = {
      [STATUS_COMPLIMENT]: {
        text: 'Compliment',
        cssClass: 'badge badge-success',
      },
      [STATUS_FIXED]: {
        text: 'Fixed',
        cssClass: 'badge badge-default',
      },
      [STATUS_IGNORED]: {
        text: 'Ignored',
        cssClass: 'badge badge-default',
      },
      [STATUS_NOT_ACTIONABLE]: {
        text: 'Not Actionable',
        cssClass: 'badge badge-default',
      },
      [STATUS_OPEN]: {
        text: 'Open',
        cssClass: 'badge badge-info',
      },
    };

    return {
      isOpen: function(status) {
        return status === STATUS_OPEN;
      },
      getStatusCssClass: function(status) {
        return STATUS_CHOICES.hasOwnProperty(status) ?
          STATUS_CHOICES[status].cssClass : 'badge badge-default';
      },
      getHumanReadableStatus: function(status) {
        return STATUS_CHOICES.hasOwnProperty(status) ?
          STATUS_CHOICES[status].text : '';
      },
    };
  }
]);
