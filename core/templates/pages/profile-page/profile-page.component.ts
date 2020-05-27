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
 * @fileoverview Data and controllers for the Oppia profile page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/OppiaFooterDirective.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/url.service.ts');
require('services/user.service.ts');
require('services/date-time-format.service.ts');

angular.module('oppia').component('profilePage', {
  template: require('./profile-page.component.html'),
  controller: [
    '$http', '$log', '$window', 'DateTimeFormatService', 'LoaderService',
    'UrlInterpolationService', 'UrlService', 'UserService',
    function($http, $log, $window, DateTimeFormatService, LoaderService,
        UrlInterpolationService, UrlService, UserService) {
      var ctrl = this;
      var profileDataUrl = (
        '/profilehandler/data/' + UrlService.getUsernameFromProfileUrl());
      var DEFAULT_PROFILE_PICTURE_URL = UrlInterpolationService
        .getStaticImageUrl('/general/no_profile_picture.png');

      ctrl.getLocaleDateString = function(millisSinceEpoch) {
        return DateTimeFormatService.getLocaleDateString(millisSinceEpoch);
      };
      ctrl.$onInit = function() {
        LoaderService.showLoadingScreen('Loading');
        $http.get(profileDataUrl).then(function(response) {
          var data = response.data;
          LoaderService.hideLoadingScreen();
          ctrl.username = {
            title: 'Username',
            value: data.profile_username,
            helpText: (data.profile_username)
          };
          ctrl.usernameIsLong = data.profile_username.length > 16;
          ctrl.userBio = data.user_bio;
          ctrl.userDisplayedStatistics = [{
            title: 'Impact',
            value: data.user_impact_score,
            helpText: (
              'A rough measure of the impact of explorations created by ' +
              'this user. Better ratings and more playthroughs improve ' +
              'this score.')
          }, {
            title: 'Created',
            value: data.created_exp_summary_dicts.length
          }, {
            title: 'Edited',
            value: data.edited_exp_summary_dicts.length
          }];

          ctrl.userEditedExplorations = data.edited_exp_summary_dicts.sort(
            function(exploration1, exploration2) {
              if (exploration1.ratings > exploration2.ratings) {
                return 1;
              } else if (exploration1.ratings === exploration2.ratings) {
                if (exploration1.playthroughs > exploration2.playthroughs) {
                  return 1;
                } else if (
                  exploration1.playthroughs === exploration2.playthroughs) {
                  return 0;
                } else {
                  return -1;
                }
              } else {
                return -1;
              }
            }
          );

          ctrl.getExplorationsToDisplay = function() {
            ctrl.explorationsOnPage = [];
            if (ctrl.userEditedExplorations.length === 0) {
              return ctrl.explorationsOnPage;
            }
            ctrl.explorationIndexStart = (
              ctrl.currentPageNumber * ctrl.PAGE_SIZE);
            ctrl.explorationIndexEnd = (
              ctrl.explorationIndexStart + ctrl.PAGE_SIZE - 1);
            for (var ind = ctrl.explorationIndexStart;
              ind <= ctrl.explorationIndexEnd; ind++) {
              ctrl.explorationsOnPage.push(
                ctrl.userEditedExplorations[ind]);
              if (ind === ctrl.userEditedExplorations.length - 1) {
                break;
              }
            }
            return ctrl.explorationsOnPage;
          };

          ctrl.numUserPortfolioExplorations = (
            data.edited_exp_summary_dicts.length);
          ctrl.subjectInterests = data.subject_interests;
          ctrl.firstContributionMsec = data.first_contribution_msec;
          ctrl.profilePictureDataUrl = (
            data.profile_picture_data_url || DEFAULT_PROFILE_PICTURE_URL);
          LoaderService.hideLoadingScreen();
        });
      };
    }
  ]
});
