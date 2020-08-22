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
 * @fileoverview Component for the item view of an opportunity.
 */
require(
  'components/common-layout-directives/common-elements/' +
  'lazy-loading.component.ts');

require(
  'filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');

angular.module('oppia').component('opportunitiesListItem', {
  bindings: {
    getOpportunity: '&opportunity',
    onClickActionButton: '=',
    isLabelRequired: '&labelRequired',
    isProgressBarRequired: '&progressBarRequired',
    getOpportunityHeadingTruncationLength:
      '&opportunityHeadingTruncationLength'
  },
  template: require('./opportunities-list-item.component.html'),
  controller: [
    '$scope', function($scope) {
      var ctrl = this;
      ctrl.$onInit = function() {
        ctrl.opportunityDataIsLoading = false;
        ctrl.opportunity = ctrl.getOpportunity();
        if (ctrl.opportunity && ctrl.isLabelRequired()) {
          ctrl.labelText = ctrl.opportunity.labelText;
          ctrl.labelStyle = {
            'background-color': ctrl.opportunity.labelColor
          };
        }
        ctrl.opportunityHeadingTruncationLength =
          ctrl.getOpportunityHeadingTruncationLength();
        if (!ctrl.opportunityHeadingTruncationLength) {
          ctrl.opportunityHeadingTruncationLength = 35;
        }
        if (ctrl.opportunity) {
          if (ctrl.opportunity.progressPercentage) {
            ctrl.progressPercentage = (
              ctrl.opportunity.progressPercentage + '%');
            ctrl.progressBarStyle = {width: ctrl.progressPercentage};
          }
        } else {
          ctrl.opportunityDataIsLoading = true;
        }
      };
    }
  ]
});
