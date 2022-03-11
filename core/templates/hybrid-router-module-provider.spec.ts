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
 * @fileoverview Unit tests for hybrid router module provider.
 */

import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { HybridRouterModuleProvider, MockRouter, MockRouterModule } from 'hybrid-router-module-provider';

describe('Hybrid router module provider', () => {
  let mockRouter: MockRouter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockRouter]
    });
    mockRouter = TestBed.inject(MockRouter);
  });

  beforeEach(() => {
    mockRouter.ngOnInit();
  });

  it('should provide router module for pages using angular router', () => {
    let bodyElement = window.document.createElement('body');
    // eslint-disable-next-line oppia/no-inner-html
    bodyElement.innerHTML = '<router-outlet></router-outlet>';

    spyOn(window.document, 'querySelector').and.returnValue(bodyElement);

    expect(HybridRouterModuleProvider.provide().ngModule).toEqual(RouterModule);
  });

  it('should provide mock router module for pages not using angular router',
    () => {
      let bodyTag = window.document.createElement('body');
      spyOn(window.document, 'querySelector').and.returnValue(bodyTag);

      expect(HybridRouterModuleProvider.provide().ngModule).toEqual(
        MockRouterModule);
    });
});
