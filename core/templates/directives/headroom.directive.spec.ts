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
 * @fileoverview Unit tests for headroom directive
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HeadroomDirective } from './headroom.directive';

@Component({
  selector: 'mock-comp-a',
  template: '  <span headroom></span>'
})
class MockCompA {}

describe('Headroom Directive', () => {
  let fixture: ComponentFixture<MockCompA>;
  let directiveInstance: HeadroomDirective;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, HeadroomDirective]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MockCompA);
    const directiveEl = fixture.debugElement.query(
      By.directive(HeadroomDirective));
    expect(directiveEl).not.toBeNull();

    directiveInstance = directiveEl.injector.get(HeadroomDirective);
  }));

  it('should create', () => {
    expect(directiveInstance.headroom).toBeDefined();
  });

  it('should destroy', () => {
    spyOn(directiveInstance.headroom, 'destroy');
    directiveInstance.ngOnDestroy();
    expect(directiveInstance.headroom.destroy).toHaveBeenCalled();
  });
});
