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
 * @fileoverview Tests for SidebarStatusService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/sidebar/SidebarStatusService.ts');

describe('SidebarStatusService', function() {
  var SidebarStatusService, $window;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, _$window_) {
    $window = _$window_;
    $window.innerWidth = 600;
    SidebarStatusService = $injector.get('SidebarStatusService');
  }));

  it('should open the sidebar if its not open', function() {
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });

  it('should close the sidebar when its open', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should toggle the sidebar to open and then close', function() {
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });


  it('should falsify pendingSidebarClick on document click', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });
});
