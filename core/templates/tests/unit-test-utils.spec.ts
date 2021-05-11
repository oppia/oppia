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
 * @fileoverview Utility functions for unit testing.
 */
import { Directive, ElementRef, Injector, destroyPlatform } from
  '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

import { setupAndGetUpgradedComponentAsync } from './unit-test-utils';
import { async } from '@angular/core/testing';

@Directive({
  selector: 'mock-ng2-component'
})
export class MockNg2Component extends UpgradeComponent {
  constructor(elementRef: ElementRef, injector: Injector) {
    super('mockNg2Component', elementRef, injector);
  }
}
describe('setupAndGetUpgradedComponent function', () => {
  beforeEach(() => destroyPlatform());
  afterEach(() => destroyPlatform());
  it('should setup component and return the proper text context', async(() => {
    setupAndGetUpgradedComponentAsync(
      'mock-ng2-component',
      'mockNg2Component',
      [MockNg2Component]
    ).then(
      async(textContext) => expect(textContext).toBe('Hello Oppia!')
    );
  }));
});
