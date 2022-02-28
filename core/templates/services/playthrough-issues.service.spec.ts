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
 * @fileoverview Unit tests for PlaythroughIssuesService.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Playthrough Issues Service', function() {
  var PlaythroughIssuesService = null;
  var PlaythroughIssueObjectFactory = null;
  var PlaythroughIssuesBackendApiService = null;
  var $q = null;
  var explorationId = 'abc1';
  var explorationVersion = 1;
  var backendIssues = [{
    issue_type: 'MultipleIncorrectSubmissions',
    issue_customization_args: {
      state_name: {
        value: 'state_name1'
      },
      state_names: {
        value: ['state_name1', 'state_name2', 'state_name3']
      },
      num_times_answered_incorrectly: {
        value: 7
      }
    },
    playthrough_ids: ['playthrough_id2'],
    schema_version: 1,
    is_valid: true
  }];


  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    PlaythroughIssueObjectFactory = $injector.get(
      'PlaythroughIssueObjectFactory');
    PlaythroughIssuesBackendApiService = $injector.get(
      'PlaythroughIssuesBackendApiService');
    $q = $injector.get('$q');

    PlaythroughIssuesService.initSession(explorationId, explorationVersion);
  }));

  it('should get issues from backend', function() {
    var backendCallSpy = spyOn(
      PlaythroughIssuesBackendApiService, 'fetchIssuesAsync').and.returnValue(
      $q.resolve(backendIssues.map(
        PlaythroughIssueObjectFactory.createFromBackendDict)));

    PlaythroughIssuesService.getIssues().then(function(issues) {
      expect(backendCallSpy).toHaveBeenCalled();
      expect(issues).toEqual(
        backendIssues.map(
          PlaythroughIssueObjectFactory.createFromBackendDict));
    });
  });
});
