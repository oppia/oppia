// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Normalize URL guard spec.
 */

import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {NormalizeUrlCaseGuard} from './normalize-url-case.guard';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

describe('NormalizeUrlCaseGuard', function () {
  let guard: NormalizeUrlCaseGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [NormalizeUrlCaseGuard],
    });
    guard = TestBed.inject(NormalizeUrlCaseGuard);
  });

  const mockRouterState = function (url: string): RouterStateSnapshot {
    return {url} as RouterStateSnapshot;
  };

  it('should be created', function () {
    expect(guard).toBeTruthy();
  });

  it('should allow navigation if URL is already lowercase', function () {
    const state = mockRouterState('/learn/science');
    const route = {} as ActivatedRouteSnapshot;

    const result = guard.canActivate(route, state);
    expect(result).toBe(true);
  });

  it('should redirect if URL contains uppercase characters', function () {
    const state = mockRouterState('/learn/SCIENCE');
    const route = {} as ActivatedRouteSnapshot;

    const result = guard.canActivate(route, state);
    expect(result instanceof UrlTree).toBeTrue();

    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/learn/science');
  });

  it('should redirect if URL has mixed case', function () {
    const state = mockRouterState('/learn/ScIeNcE');
    const route = {} as ActivatedRouteSnapshot;

    const result = guard.canActivate(route, state);
    expect(result instanceof UrlTree).toBeTrue();

    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/learn/science');
  });
});
