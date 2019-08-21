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
 * @fileoverview Tests for Community dashboard constants.
 */

require(
  'pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts');

describe('Community dashboard page constants', function() {
  var COMMUNITY_DASHBOARD_TABS_DETAILS = null;
  var tabDetailsTemplate = {
    ariaLabel: 'string',
    tabName: 'string',
    description: 'string',
    customizationOptions: 'array'
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    COMMUNITY_DASHBOARD_TABS_DETAILS = $injector.get(
      'COMMUNITY_DASHBOARD_TABS_DETAILS');
  }));

  it('should have expected template for tab details', function() {
    for (var tabName in COMMUNITY_DASHBOARD_TABS_DETAILS) {
      var tabDetails = COMMUNITY_DASHBOARD_TABS_DETAILS[tabName];
      for (var infoKey in tabDetailsTemplate) {
        expect(tabDetails.hasOwnProperty(infoKey)).toBeTruthy();
        if (tabDetailsTemplate[infoKey] === 'string') {
          expect(typeof tabDetails[infoKey]).toEqual('string');
        } else if (tabDetailsTemplate[infoKey] === 'array') {
          expect(Array.isArray(tabDetails[infoKey])).toBeTruthy();
        }
      }
    }
  });
});
