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
 * @fileoverview Unit tests for the translatable set of unicode string editor.
 */

// TODO(#11014): Add more extensive front end tests for object editors that rely
// on schema editors.
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {TranslatableSetOfUnicodeStringEditorComponent} from './translatable-set-of-unicode-string-editor.component';

// TODO(#11014): Add more extensive front end tests for object editors that rely
// on schema editors.
describe('TranslatableSetOfUnicodeStringEditor', () => {
  let component: TranslatableSetOfUnicodeStringEditorComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TranslatableSetOfUnicodeStringEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    component = TestBed.createComponent(
      TranslatableSetOfUnicodeStringEditorComponent
    ).componentInstance;

    component.ngOnInit();
  }));

  it('should initialize the schema', () => {
    component.value = {unicodeStrSet: 'random val'};
    component.updateValue('random val');
    component.getSchema();
    component.updateValue('abc');
    expect(component.value.unicodeStrSet).toBe('abc');
  });

  it('should initialize the schema property value', () => {
    expect(component.value.unicodeStrSet).toBe('');
  });
});
