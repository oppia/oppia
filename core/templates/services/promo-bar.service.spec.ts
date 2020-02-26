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
 * @fileoverview Tests that the resource service is working as expected.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('App.ts');
require('services/promo-bar.service.ts');

describe('Promo bar Service', function() {
  var PromoBarService, $httpBackend;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    PromoBarService = $injector.get('PromoBarService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return promo bar data', function() {
    var requestUrl = '/promo_bar_handler';
    $httpBackend.expect('GET', requestUrl).respond(200, {
      promo_bar_enabled: true,
      promo_bar_message: 'test message'
    });

    PromoBarService.getPromoBarData().then(function(data) {
      expect(data.promoBarEnabled).toBe(true);
      expect(data.promoBarMessage).toBe('test message');
    });
    $httpBackend.flush();
  });
});
