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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

import { EventEmitter } from '@angular/core';

require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-opportunities-backend-api.service.ts');

angular.module('oppia').factory('ContributionOpportunitiesService', [
  '$uibModal', 'ContributionOpportunitiesBackendApiService',
  'UrlInterpolationService',
  function(
      $uibModal, ContributionOpportunitiesBackendApiService,
      UrlInterpolationService) {
    var reloadOpportunitiesEventEmitter = new EventEmitter<void>();
    var removeOpportunitiesEventEmitter = new EventEmitter<void>();

    var skillOpportunitiesCursor = null;
    var translationOpportunitiesCursor = null;
    var voiceoverOpportunitiesCursor = null;
    var moreSkillOpportunitiesAvailable = true;
    var moreTranslationOpportunitiesAvailable = true;
    var moreVoiceoverOpportunitiesAvailable = true;

    var _getSkillOpportunities = function(cursor) {
      return ContributionOpportunitiesBackendApiService.fetchSkillOpportunities(
        cursor).then(({ opportunities, nextCursor, more }) => {
        skillOpportunitiesCursor = nextCursor;
        moreSkillOpportunitiesAvailable = more;
        return {
          opportunities: opportunities,
          more: more
        };
      });
    };
    var _getTranslationOpportunities = function(languageCode, cursor) {
      return ContributionOpportunitiesBackendApiService
        .fetchTranslationOpportunities(
          languageCode, cursor).then(({ opportunities, nextCursor, more }) => {
          translationOpportunitiesCursor = nextCursor;
          moreTranslationOpportunitiesAvailable = more;
          return {
            opportunities: opportunities,
            more: more
          };
        });
    };
    var _getVoiceoverOpportunities = function(languageCode, cursor) {
      return ContributionOpportunitiesBackendApiService
        .fetchVoiceoverOpportunities(languageCode, cursor).then(
          function({ opportunities, nextCursor, more }) {
            voiceoverOpportunitiesCursor = nextCursor;
            moreVoiceoverOpportunitiesAvailable = more;
            return {
              opportunities: opportunities,
              more: more
            };
          });
    };

    var showRequiresLoginModal = function(argument) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/community-dashboard-page/modal-templates/' +
          'login-required-modal.directive.html'),
        backdrop: 'static',
        controller: [
          '$controller', '$scope', '$uibModalInstance',
          function($controller, $scope, $uibModalInstance) {
            $controller('ConfirmOrCancelModalController', {
              $scope: $scope,
              $uibModalInstance: $uibModalInstance
            });
          }]
      }).result.then(function() {}, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    return {
      getSkillOpportunitiesAsync: async function() {
        return _getSkillOpportunities('');
      },
      getTranslationOpportunitiesAsync: async function(languageCode) {
        return _getTranslationOpportunities(languageCode, '');
      },
      getVoiceoverOpportunities: async function(languageCode) {
        return _getVoiceoverOpportunities(languageCode, '');
      },
      getMoreSkillOpportunitiesAsync: async function() {
        if (moreSkillOpportunitiesAvailable) {
          return _getSkillOpportunities(skillOpportunitiesCursor);
        }
      },
      getMoreTranslationOpportunitiesAsync: async function(languageCode) {
        if (moreTranslationOpportunitiesAvailable) {
          return _getTranslationOpportunities(
            languageCode, translationOpportunitiesCursor);
        }
      },
      getMoreVoiceoverOpportunities: async function(languageCode) {
        if (moreVoiceoverOpportunitiesAvailable) {
          return _getVoiceoverOpportunities(
            languageCode, voiceoverOpportunitiesCursor);
        }
      },
      showRequiresLoginModal: showRequiresLoginModal,
      reloadOpportunitiesEventEmitter: reloadOpportunitiesEventEmitter,
      removeOpportunitiesEventEmitter: removeOpportunitiesEventEmitter,
    };
  }]);
