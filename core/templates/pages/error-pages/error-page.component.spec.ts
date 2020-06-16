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
 * @fileoverview Unit tests for error page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Error page', function() {
  var ctrl = null;
  var Title = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    Title = $injector.get('Title');
    ctrl = $componentController('errorPage', {}, {
      statusCode: '404'
    });
  }));

  it('should check if status code is a number', function() {
    expect(ctrl.getStatusCode()).toBe(404);
    expect(ctrl.getStatusCode()).toBeInstanceOf(Number);
  });

  it('should set images and page title when $onInit triggers', function() {
    ctrl.$onInit();

    expect(ctrl.oopsMintImgUrl).toBe('/assets/images/general/oops_mint.png');
    expect(Title.getTitle()).toBe('Error 404 - Oppia');
  });
});
