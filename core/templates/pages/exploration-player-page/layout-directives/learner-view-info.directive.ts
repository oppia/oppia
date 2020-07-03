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
 * @fileoverview Directive for the learner view info section of the
 * footer.
 */

require('components/profile-link-directives/profile-link-image.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.directive.ts');
require('filters/summarize-nonnegative-number.filter.ts');
require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');
require(
  'pages/exploration-player-page/templates/' +
  'information-card-modal.controller.ts');

require('components/ratings/rating-computation/rating-computation.service.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/date-time-format.service.ts');

angular.module('oppia').directive('learnerViewInfo', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      template: require('./learner-view-info.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$log', '$uibModal', 'ContextService',
        'ReadOnlyExplorationBackendApiService', 'UrlInterpolationService',
        'UrlService', 'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR',
        'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
        function($http, $log, $uibModal, ContextService,
            ReadOnlyExplorationBackendApiService, UrlInterpolationService,
            UrlService, DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR,
            EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
          var ctrl = this;
          var explorationId = ContextService.getExplorationId();
          var expInfo = null;
          ctrl.showInformationCard = function() {
            if (expInfo) {
              openInformationCardModal();
            } else {
              $http.get(EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
                params: {
                  stringified_exp_ids: JSON.stringify([explorationId]),
                  include_private_explorations: JSON.stringify(
                    true)
                }
              }).then(function(response) {
                expInfo = response.data.summaries[0];
                openInformationCardModal();
              }, function() {
                $log.error(
                  'Information card failed to load for exploration ' +
                  explorationId);
              });
            }
          };

          var openInformationCardModal = function() {
            $uibModal.open({
              animation: true,
              template: require(
                'pages/exploration-player-page/templates/' +
                'information-card-modal.directive.html'),
              windowClass: 'oppia-modal-information-card',
              resolve: {
                expInfo: function() {
                  return expInfo;
                }
              },
              controller: 'InformationCardModalController'
            });
          };
          ctrl.$onInit = function() {
            ctrl.explorationTitle = 'Loading...';
            ReadOnlyExplorationBackendApiService.fetchExploration(
              explorationId, UrlService.getExplorationVersionFromUrl())
              .then(function(response) {
                ctrl.explorationTitle = response.exploration.title;
              });
          };
        }
      ]
    };
  }]);
