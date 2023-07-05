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
 * @fileoverview Unit tests for the translatable set of normalized string
 * editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TranslatableSetOfNormalizedStringEditorComponent } from './translatable-set-of-normalized-string-editor.component';

// TODO(#11014): Add more extensive front end tests for object editors that rely
// on schema editors.
describe('TranslatableSetOfNormalizedStringEditor', () => {
  let component: TranslatableSetOfNormalizedStringEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TranslatableSetOfNormalizedStringEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    component = TestBed.createComponent(
      TranslatableSetOfNormalizedStringEditorComponent
    ).componentInstance;

    component.ngOnInit();
  }));

  it('should initialize the schema', fakeAsync(() => {
    component.value = { normalizedStrSet: 'random val' };
    tick();

    component.updateValue('random val');
    component.getSchema();
    component.updateValue('abc');
    expect(component.value.normalizedStrSet).toBe('abc');
  }));

  it('should initialize the schema property value', fakeAsync(() => {
    expect(component.value.normalizedStrSet).toBe('');
  }));
});
