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
 * @fileoverview Unit tests for maintenance page controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/maintenance-page/maintenance-page.component.ts');

describe('Maintenance page', function() {
  var $scope = null;
  var ctrl = null;
  var DocumentAttributeCustomizationService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    DocumentAttributeCustomizationService = $injector.get(
      'DocumentAttributeCustomizationService');
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('maintenancePage', {
      $scope: $scope
    });
  }));

  it('should set document lang when $onInit is called', function() {
    spyOn(DocumentAttributeCustomizationService, 'addAttribute').and
      .callThrough();
    ctrl.$onInit();

    expect($scope.currentLang).toBe('en');
    expect(DocumentAttributeCustomizationService.addAttribute)
      .toHaveBeenCalledWith('lang', 'en');
  });

  it('should get static image url', function() {
    var imagePath = '/path/to/image.png';
    var staticImageUrl = $scope.getStaticImageUrl(imagePath);

    expect(staticImageUrl).toBe('/assets/images/path/to/image.png');
  });
});
