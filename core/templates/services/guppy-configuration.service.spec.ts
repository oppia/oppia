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
 * @fileoverview Unit test for GuppyConfigurationService
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, OnInit } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GuppyConfigurationService } from
  'services/guppy-configuration.service';

declare global {
  interface Window {
    Guppy: Guppy;
  }
}

class MockGuppy {
  constructor(id: string, config: Object) {}

  asciimath(): string {
    return 'Dummy value';
  }

  configure(name: string, val: Object): void {}
  static event(name: string, handler: Function): void {
    handler({focused: true});
  }

  static configure(name: string, val: Object): void {}
  static 'remove_global_symbol'(symbol: string): void {}
  static 'add_global_symbol'(name: string, symbol: Object): void {}
}

class MockComponent {
  guppyConfigService: GuppyConfigurationService;
  constructor(guppyConfigService: GuppyConfigurationService) {
    this.guppyConfigService = guppyConfigService;
  }

  onInit(): void {
    this.guppyConfigService.init();
  }
}

@Component({
  template: '',
  selector: 'mock-component-b'
})
class MockComponentB implements OnInit {
  constructor(private guppyConfigService: GuppyConfigurationService) {}

  ngOnInit(): void {
    this.guppyConfigService.init();
  }
}

let guppyConfigurationService: GuppyConfigurationService;

describe('GuppyConfigurationService', () => {
  beforeEach(() => {
    guppyConfigurationService = TestBed.get(GuppyConfigurationService);
    window.Guppy = MockGuppy as unknown as Guppy;
  });

  describe('Individual service', () => {
    it('should configure guppy if service is not initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not configure guppy if service is initialized', () => {
      GuppyConfigurationService.serviceIsInitialized = true;
      spyOn(Guppy, 'remove_global_symbol');
      guppyConfigurationService.init();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });
});

describe('GuppyConfigurationService', () => {
  describe('Components calling the service', () => {
    let component: MockComponentB;
    let fixture: ComponentFixture<MockComponentB>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule(
        {
          imports: [HttpClientTestingModule],
          declarations: [MockComponentB],
        }
      ).compileComponents();
      guppyConfigurationService = TestBed.get(GuppyConfigurationService);
      window.Guppy = MockGuppy as unknown as Guppy;
    }));
    beforeEach(() => {
      fixture = TestBed.createComponent(
        MockComponentB);
      component = fixture.componentInstance;
    });


    it('should configure guppy on the first initialization', () => {
      GuppyConfigurationService.serviceIsInitialized = false;
      spyOn(Guppy, 'remove_global_symbol');
      component.ngOnInit();
      expect(Guppy.remove_global_symbol).toHaveBeenCalled();
    });

    it('should not configure guppy on multiple initializations', () => {
      component.ngOnInit();

      spyOn(Guppy, 'remove_global_symbol');
      component.ngOnInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();

      let mockComponent = new MockComponent(guppyConfigurationService);
      mockComponent.onInit();
      expect(Guppy.remove_global_symbol).not.toHaveBeenCalled();
    });
  });
});
