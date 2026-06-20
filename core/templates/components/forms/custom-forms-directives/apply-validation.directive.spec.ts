// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Directive for applying validation.
 */

import {Component} from '@angular/core';
import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormControl} from '@angular/forms';
import {ApplyValidationDirective} from './apply-validation.directive';
import {Validator} from 'interactions/TextInput/directives/text-input-validation.service';

@Component({
  selector: 'mock-comp-a',
  template: '<div applyValidation></div>',
})
class MockCompA {}

describe('Apply validation directive', () => {
  let fixture: ComponentFixture<MockCompA>;
  let directiveInstance: ApplyValidationDirective;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockCompA, ApplyValidationDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(MockCompA);
    fixture.detectChanges();

    const directiveEl = fixture.debugElement.query(
      By.directive(ApplyValidationDirective)
    );
    expect(directiveEl).not.toBeNull();
    directiveInstance = directiveEl.injector.get(ApplyValidationDirective);
  }));

  it('should return null on validating with empty validators', () => {
    directiveInstance.validators = [];

    expect(directiveInstance.validate(new FormControl(1))).toBeNull();
  });

  it('should validate value', () => {
    directiveInstance.validators = [
      {
        id: 'isAtLeast',
        minValue: -2.5,
      },
    ] as unknown as Validator[];

    expect(directiveInstance.validate(new FormControl(2))).toBeNull();

    expect(directiveInstance.validate(new FormControl(null))).toEqual({
      isAtLeast: {
        minValue: -2.5,
        actual: null,
      },
    });
  });
});
