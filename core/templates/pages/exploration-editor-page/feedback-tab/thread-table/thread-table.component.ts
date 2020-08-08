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
 * @fileoverview Directive for displaying the list of threads in the feedback
 * tab of the exploration editor.
 */

require('filters/string-utility-filters/truncate.filter.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require('services/date-time-format.service.ts');

angular.module('oppia').component('threadTable', {
  bindings: {
    onClickRow: '=',
    getThreads: '&threads'
  },
  template: require('./thread-table.component.html'),
  controller: [
    '$scope', 'ThreadStatusDisplayService', 'DateTimeFormatService',
    function($scope, ThreadStatusDisplayService, DateTimeFormatService) {
      $scope.getLabelClass = function(status) {
        return ThreadStatusDisplayService.getLabelClass(status);
      };
      $scope.getHumanReadableStatus = function(status) {
        return ThreadStatusDisplayService.getHumanReadableStatus(status);
      };
      $scope.getLocaleAbbreviatedDatetimeString = function(
          millisSinceEpoch) {
        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
          millisSinceEpoch);
      };
    }
  ]
});
