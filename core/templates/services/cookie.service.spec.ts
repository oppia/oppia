// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for OppiaCookieService.
 */

import { TestBed } from '@angular/core/testing';
import { CookieModule, CookieService } from 'ngx-cookie';
import { OppiaCookieService } from './cookie.service';

describe('Oppia Cookie Service', () => {
  let oppiaCookieService: OppiaCookieService;
  let ngxCookieService: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CookieModule.forRoot()],
    });
  });

  beforeEach(() => {
    oppiaCookieService = TestBed.inject(OppiaCookieService);
    ngxCookieService = TestBed.inject(CookieService);
    ngxCookieService.removeAll();
  });

  it(
    'should set a value and' +
    ' return the cookie-value when an existing key is requested',
    () => {
      oppiaCookieService.putCookie('Random-Key', 'Random Value');
      expect(oppiaCookieService.getCookie('Random-Key')).toBe('Random Value');
    }
  );

  it(
    'should set a non-string value and' +
    ' return the cookie-value when an existing key is requested',
    () => {
      oppiaCookieService.putCookie('Random-Key', 'true');
      expect(oppiaCookieService.getCookie('Random-Key')).toBe('true');
    }
  );

  it('should return null when a non-existing key is requested', () => {
    expect(oppiaCookieService.getCookie('non-existing-key')).toBeNull();
  });
});
