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
 * @fileoverview Tests for BottomNavbarStatusService.
 */

import { TestBed } from '@angular/core/testing';

import { BottomNavbarStatusService } from
  'services/bottom-navbar-status.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

describe('BottomNavbarStatusService', () => {
  let bss: BottomNavbarStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: WindowDimensionsService,
        useValue: {
          isWindowNarrow: () => true,
          getWidth: () => 800
        }
      }]
    });

    bss = TestBed.get(BottomNavbarStatusService);
  });

  it('should have bottom navbar disabled by default', () => {
    expect(bss.bottomNavbarIsEnabled).toBe(false);
  });

  it('should have mark bottom navbar enabled', () => {
    bss.markBottomNavbarStatus(true);
    expect(bss.bottomNavbarIsEnabled).toBe(true);
  });

  it('should return if the bottom navbar is enabled', () => {
    expect(bss.isBottomNavbarEnabled()).toBe(false);
    bss.markBottomNavbarStatus(true);
    expect(bss.isBottomNavbarEnabled()).toBe(true);
  });
});
