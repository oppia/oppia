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
    this.upgradedServices = new UpgradedServices();
    // We need to access the "registerService" method to test its edge cases,
    // but we want to keep it private to discourage registering services in
    // places outside of the UpgradedServices class. To compromise, we use this
    // type-erasing hack to gain access to the method.
    this.registerService = (this.upgradedServices as any).registerService;
  });

  it('should have a well-defined set of initial services', () => {
    expect(() => this.upgradedServices.getUpgradedServices()).not.toThrow();
  });

  it('should detect service redefinitions', () => {
    class MockService {}

    this.registerService(MockService).withDependencies();
    expect(() => this.registerService(MockService).withDependencies())
      .toThrow(/Redefinition Error/);
  });

  it('should detect unregistered services', () => {
    class MockDependency {}
    class MockService {
      constructor(private mockDependency: MockDependency) {}
    };

    this.registerService(MockService).withDependencies(MockDependency);
    expect(() => this.upgradedServices.getUpgradedServices())
      .toThrow(/Registry Error/);
  });

  it('should detect cyclic dependencies', () => {
    class MockService1 { constructor(private mockService2: MockService2) {} }
    class MockService2 { constructor(private mockService1: MockService1) {} }

    this.registerService(MockService1).withDependencies(MockService2);
    this.registerService(MockService2).withDependencies(MockService1);
    expect(() => this.upgradedServices.getUpgradedServices())
      .toThrow(/Circular Dependency Error/);
  });
});
