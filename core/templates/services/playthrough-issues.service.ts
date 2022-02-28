// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for retrieving issues and playthroughs.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/playthrough-issues-backend-api.service.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');

angular.module('oppia').factory('PlaythroughIssuesService', [
  'PlaythroughIssuesBackendApiService',
  function(
      PlaythroughIssuesBackendApiService) {
    var explorationId = null;
    var explorationVersion = null;

    return {
      /** Prepares the PlaythroughIssuesService for subsequent calls to other
       * functions.
       *
       * @param {string} newExplorationId - the exploration id the service will
       *    be targeting.
       * @param {number} newExplorationVersion - the version of the exploration
       *    the service will be targeting.
       */
      initSession: function(newExplorationId, newExplorationVersion) {
        explorationId = newExplorationId;
        explorationVersion = newExplorationVersion;
      },
      getIssues: function() {
        return PlaythroughIssuesBackendApiService.fetchIssuesAsync(
          explorationId, explorationVersion);
      }
    };
  }]);
