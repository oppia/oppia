// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for obile menu service for new lesson player.
 */

import {TestBed} from '@angular/core/testing';
import {MobileMenuService} from './mobile-menu.service';

describe('MobileMenuService', () => {
  let service: MobileMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MobileMenuService],
    });
    service = TestBed.inject(MobileMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially have menu visibility set to false', () => {
    service.getMenuVisibility().subscribe(visibility => {
      expect(visibility).toBe(false);
    });
  });

  it('should update menu visibility when toggled', () => {
    let currentValue: boolean | undefined;
    service.getMenuVisibility().subscribe(value => (currentValue = value));
    service.toggleMenuVisibility();
    expect(currentValue).toBe(true);
    service.toggleMenuVisibility();
    expect(currentValue).toBe(false);
  });
});
