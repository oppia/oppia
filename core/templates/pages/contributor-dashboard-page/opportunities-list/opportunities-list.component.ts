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
 * @fileoverview Component for the list view of opportunities.
 */

require(
  'pages/contributor-dashboard-page/opportunities-list-item/' +
  'opportunities-list-item.component.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('opportunitiesList', {
  bindings: {
    loadOpportunities: '<',
    labelRequired: '<',
    progressBarRequired: '<',
    loadMoreOpportunities: '<',
    onClickActionButton: '<',
    opportunityHeadingTruncationLength: '<'
  },
  template: require('./opportunities-list.component.html'),
  controller: [
    '$rootScope', 'ContributionOpportunitiesService',
    'TranslationLanguageService', 'OPPORTUNITIES_PAGE_SIZE', function(
        $rootScope, ContributionOpportunitiesService,
        TranslationLanguageService, OPPORTUNITIES_PAGE_SIZE) {
      var ctrl = this;
      var opportunities = [];
      ctrl.visibleOpportunities = [];
      ctrl.directiveSubscriptions = new Subscription();

      ctrl.directiveSubscriptions.add(
        TranslationLanguageService.onActiveLanguageChanged.subscribe(
          () => ctrl.$onInit()));

      ctrl.directiveSubscriptions.add(
        ContributionOpportunitiesService
          .reloadOpportunitiesEventEmitter.subscribe(() => ctrl.$onInit()));

      ctrl.directiveSubscriptions.add(
        ContributionOpportunitiesService
          .removeOpportunitiesEventEmitter.subscribe((opportunityIds) => {
            opportunities = opportunities.filter(function(opportunity) {
              return opportunityIds.indexOf(opportunity.id) < 0;
            });
            ctrl.visibleOpportunities = opportunities.slice(
              0, OPPORTUNITIES_PAGE_SIZE);
          }));

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };

      ctrl.$onInit = function() {
        opportunities = [];
        ctrl.visibleOpportunities = [];
        ctrl.activePageNumber = 1;
        ctrl.lastPageNumber = 1000;
        ctrl.loadingOpportunityData = true;

        ctrl.loadOpportunities().then(function({opportunitiesDicts, more}) {
          opportunities = opportunitiesDicts;
          ctrl.visibleOpportunities = opportunities.slice(
            0, OPPORTUNITIES_PAGE_SIZE);
          ctrl.lastPageNumber = more ? ctrl.lastPageNumber : Math.ceil(
            opportunities.length / OPPORTUNITIES_PAGE_SIZE);
          ctrl.loadingOpportunityData = false;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });
      };

      ctrl.gotoPage = function(pageNumber) {
        var startIndex = (pageNumber - 1) * OPPORTUNITIES_PAGE_SIZE;
        var endIndex = pageNumber * OPPORTUNITIES_PAGE_SIZE;
        if (startIndex >= opportunities.length) {
          ctrl.visibleOpportunities = [];
          ctrl.loadingOpportunityData = true;
          ctrl.loadMoreOpportunities().then(
            function({opportunitiesDicts, more}) {
              opportunities = opportunities.concat(opportunitiesDicts);
              ctrl.visibleOpportunities = opportunities.slice(
                startIndex, endIndex);
              ctrl.lastPageNumber = more ? ctrl.lastPageNumber : Math.ceil(
                opportunities.length / OPPORTUNITIES_PAGE_SIZE);
              ctrl.loadingOpportunityData = false;
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the controller is migrated to angular.
              $rootScope.$applyAsync();
            });
        } else {
          ctrl.visibleOpportunities = opportunities.slice(startIndex, endIndex);
        }
        ctrl.activePageNumber = pageNumber;
      };
    }]
});
