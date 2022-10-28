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
 * @fileoverview Tests for Contributor dashboard constants.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/contributor-dashboard-page.constants.ajs.ts');

describe('Contributor dashboard page constants', function() {
  var CONTRIBUTOR_DASHBOARD_TABS_DETAILS = null;
  var tabDetailsTemplate = {
    ariaLabel: 'string',
    tabName: 'string',
    description: 'string',
    customizationOptions: 'array'
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    CONTRIBUTOR_DASHBOARD_TABS_DETAILS = $injector.get(
      'CONTRIBUTOR_DASHBOARD_TABS_DETAILS');
  }));

  it('should have expected template for tab details', function() {
    for (var tabName in CONTRIBUTOR_DASHBOARD_TABS_DETAILS) {
      var tabDetails = CONTRIBUTOR_DASHBOARD_TABS_DETAILS[tabName];
      for (var infoKey in tabDetailsTemplate) {
        expect(tabDetails.hasOwnProperty(infoKey)).toBe(true);
        if (tabDetailsTemplate[infoKey] === 'string') {
          expect(typeof tabDetails[infoKey]).toEqual('string');
        } else if (tabDetailsTemplate[infoKey] === 'array') {
          expect(Array.isArray(tabDetails[infoKey])).toBe(true);
        }
      }
    }
  });
});
