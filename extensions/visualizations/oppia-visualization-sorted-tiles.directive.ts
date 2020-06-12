// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the SortedTiles visualization.
 */

require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaVisualizationSortedTiles', function() {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {},
    template: require('./oppia-visualization-sorted-tiles.directive.html'),
    controllerAs: '$ctrl',
    controller: [
      '$attrs', 'HtmlEscaperService',
      function($attrs, HtmlEscaperService) {
        this.$onInit = () => {
          this.data = HtmlEscaperService.escapedJsonToObj($attrs.escapedData);
          this.options = (
            HtmlEscaperService.escapedJsonToObj($attrs.escapedOptions));
          this.addressedInfoIsSupported = $attrs.addressedInfoIsSupported;
        };
      }
    ]
  };
});
