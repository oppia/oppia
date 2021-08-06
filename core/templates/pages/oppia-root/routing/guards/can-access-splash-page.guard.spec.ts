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
 * @fileoverview Unit tests for can access splash page guard.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AccessValidationBackendApiService } from '../access-validation-backend-api.service';
import { CanAccessSplashPageGuard } from './can-access-splash-page.guard';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: ''
    }
  };
}

class MockRouterModule {
  navigate(fragments: string[]): void {}
}

describe('Can access splash page guard', () => {
  let caspg: CanAccessSplashPageGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let windowRef: MockWindowRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        AccessValidationBackendApiService,
        {
          provide: Router,
          useClass: MockRouterModule
        }
      ]
    }).compileComponents();
    caspg = TestBed.inject(CanAccessSplashPageGuard);
    windowRef = TestBed.inject(WindowRef);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService);
  });

  it('should redirect user to default dashboard', fakeAsync(() => {
    let defaultDashboard = 'learner';
    spyOn(accessValidationBackendApiService, 'validateAccessToSplashPage')
      .and.returnValue(Promise.resolve({
        valid: false,
        default_dashboard: defaultDashboard
      }));
    caspg.canLoad(null, null);
    tick();
    expect(windowRef.nativeWindow.location.href).toEqual(
      '/' + defaultDashboard + '-dashboard');
  }));
});
