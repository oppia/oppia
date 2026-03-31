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
 * @fileoverview Unit tests for the positive int component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {PositiveIntEditorComponent} from './positive-int-editor.component';

describe('PositiveInt', function () {
  let component: PositiveIntEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PositiveIntEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    component = TestBed.createComponent(
      PositiveIntEditorComponent
    ).componentInstance;
  }));

  it('should initialize the value', () => {
    component.getSchema();
    component.ngOnInit();
    expect(component.value).toEqual(1);
    component.updateValue(2);
    component.updateValue(2);
    expect(component.value).toEqual(2);
  });
});
