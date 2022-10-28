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

import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MathJaxDirective } from './mathjax.directive';

/**
 * @fileoverview Unit tests for mathjax directive
 */

@Component({
  selector: 'mock-comp-a',
  template: '  <span [oppiaMathJax]="expr"></span>'
})
class MockCompA {
  expr: string = '/frac{x}{y}';
}
const mockMathJaxHub = {
  Queue: () => {
    return;
  }
};
const mockMathJs = {
  Hub: mockMathJaxHub
};

describe('MathJax directive', () => {
  let component: MockCompA;
  let fixture: ComponentFixture<MockCompA>;
  const originalMathJax = window.MathJax;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, MathJaxDirective]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MockCompA);
    component = fixture.componentInstance;
    window.MathJax = mockMathJs as unknown as typeof MathJax;
  }));

  afterEach(() => {
    window.MathJax = originalMathJax;
  });

  it('should re render math expr when expr changes', waitForAsync(() => {
    const spy = spyOn(mockMathJaxHub, 'Queue');
    component.expr = '/frac{z}{y}';
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  }));
});
