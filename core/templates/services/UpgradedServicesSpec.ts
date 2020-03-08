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
 * @fileoverview Tests for UpgradedServices.
 */

import { TestBed } from '@angular/core/testing';

import { UpgradedServices } from 'services/UpgradedServices';

describe('UpgradedServices', () => {
  beforeEach(() => {
    this.upgradedServices = TestBed.get(UpgradedServices);
    // We need to access the private method "registerService" to test its edge
    // cases. The method is private because calling it can cause result in very
    // hard-to-find errors at run-time. As a compromise, we use this hack to
    // test our expectations on the method.
    this.registerService = (this.upgradedServices as any).registerService;
  });

  it('catches out-of-order issues', () => {
    class MockDependency {};
    class MockService {
      constructor(private mockDependency: MockDependency) {}
    };

    expect(() => this.registerService(MockService).withArgs(MockDependency))
      .toThrowError(/Dependency Error/);
  });

  it('catches redefinition errors', () => {
    class MockService {};

    this.registerService(MockService).withArgs();
    expect(() => this.registerService(MockService).withArgs())
      .toThrowError(/Redefinition Error/);
  });
});
