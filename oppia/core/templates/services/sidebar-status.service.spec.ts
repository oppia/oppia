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

import {TestBed} from '@angular/core/testing';

import {SidebarStatusService} from 'services/sidebar-status.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('SidebarStatusService', () => {
  let sss: SidebarStatusService;
  let $window: WindowRef;

  beforeEach(() => {
    $window = TestBed.inject(WindowRef);
    sss = TestBed.inject(SidebarStatusService);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty($window.nativeWindow, 'innerWidth', {
      get: () => undefined,
    });
    spyOnProperty($window.nativeWindow, 'innerWidth').and.returnValue(600);
  });

  it('should open the sidebar if its not open', () => {
    sss.openSidebar();
    expect(sss.isSidebarShown()).toBe(true);
  });

  it('should close the sidebar when its open', () => {
    sss.openSidebar();
    sss.closeSidebar();
    expect(sss.isSidebarShown()).toBe(false);
  });

  it('should toggle the sidebar to open and then close', () => {
    sss.toggleSidebar();
    expect(sss.isSidebarShown()).toBe(true);
    sss.toggleSidebar();
    expect(sss.isSidebarShown()).toBe(false);
  });

  it('should toggle hamburger status when clicking on hamburger icon', () => {
    const clickEvent = new CustomEvent('click');
    expect(sss.isHamburgerIconclicked()).toBeFalse();
    sss.toggleHamburgerIconStatus(clickEvent);
    expect(sss.isHamburgerIconclicked()).toBeTrue();
    sss.toggleHamburgerIconStatus(clickEvent);
    expect(sss.isHamburgerIconclicked()).toBeFalse();
  });

  it('should close the siderbar on document click when its open', () => {
    const clickEvent = new CustomEvent('click');
    sss.toggleHamburgerIconStatus(clickEvent);
    expect(sss.isHamburgerIconclicked()).toBe(true);
    sss.openSidebar();
    sss.onDocumentClick();
    expect(sss.isSidebarShown()).toBe(false);
    expect(sss.isHamburgerIconclicked()).toBe(false);
  });
});
