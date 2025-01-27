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
 * @fileoverview Unit tests for mathjax directive
 */

import {Component} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MathJaxDirective} from './mathjax.directive';
import {InsertScriptService} from 'services/insert-script.service';
import {By} from '@angular/platform-browser';

/**
 * @fileoverview Unit tests for mathjax directive
 */

@Component({
  selector: 'mock-comp-a',
  template: '  <span [oppiaMathJax]="expr"></span>',
})
class MockCompA {
  expr: string = '/frac{x}{y}';
}

const mockMathJaxHub = {
  Queue: () => {
    return;
  },
};
const mockMathJs = {
  Hub: mockMathJaxHub,
};

describe('MathJax directive', () => {
  let component: MockCompA;
  let fixture: ComponentFixture<MockCompA>;
  let mockInsertScriptService: jasmine.SpyObj<InsertScriptService>;
  const originalMathJax = window.MathJax;

  beforeEach(waitForAsync(() => {
    mockInsertScriptService = jasmine.createSpyObj('InsertScriptService', [
      'loadScript',
      'hasScriptLoaded',
    ]);
    TestBed.configureTestingModule({
      declarations: [MockCompA, MathJaxDirective],
      providers: [
        {provide: InsertScriptService, useValue: mockInsertScriptService},
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MockCompA);
    component = fixture.componentInstance;
    window.MathJax = mockMathJs as unknown as typeof MathJax;
    mockInsertScriptService.loadScript.and.callFake((script, callback) => {
      // Simulate script loaded.
      callback();
    });
    mockInsertScriptService.hasScriptLoaded.and.returnValue(true);
    // Trigger Angular's change detection.
    fixture.detectChanges();
  }));

  afterEach(() => {
    window.MathJax = originalMathJax;
  });

  it('should re-render math expr when expr changes', waitForAsync(() => {
    const spy = spyOn(mockMathJaxHub, 'Queue');
    component.expr = '/frac{z}{y}';
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();

    const el = fixture.debugElement.query(By.directive(MathJaxDirective));

    const scriptTag = el.nativeElement.querySelector('script[type="math/tex"]');
    expect(scriptTag).not.toBeNull();
    expect(scriptTag.textContent).toContain('/frac{z}{y}');
  }));
});
