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
 * @fileoverview Unit tests for oppia ng init directive.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgInitDirective } from './ng-init.directive';

@Component({
  selector: 'mock-comp-a',
  template: '<div (oppiaNgInit)="divInitialized()"></div>'
})
class MockCompA {
  divInitialized(): void {
    return;
  }
}

describe('OppiaNgInit', () => {
  let component: MockCompA;
  let fixture: ComponentFixture<MockCompA>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, NgInitDirective]
    }).compileComponents();
  }));
  it('should run divInitialized when the tag is initialized', waitForAsync(
    () => {
      fixture = TestBed.createComponent(MockCompA);
      component = fixture.componentInstance;
      const initSpy = spyOn(component, 'divInitialized');
      fixture.detectChanges();
      expect(initSpy).toHaveBeenCalled();
    }));
});
