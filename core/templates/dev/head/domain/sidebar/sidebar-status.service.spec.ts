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
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { TestBed } from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('SidebarStatusService', () => {
  let sss, $window;

  beforeEach(() => {
    $window = TestBed.get(WindowRef);
    $window.nativeWindow.innerWidth = 600;
    sss = TestBed.get(SidebarStatusService);
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


  it('should falsify pendingSidebarClick on document click', () => {
    sss.openSidebar();
    sss.onDocumentClick();
    expect(sss.isSidebarShown()).toBe(true);
    sss.onDocumentClick();
    expect(sss.isSidebarShown()).toBe(false);
  });
});
