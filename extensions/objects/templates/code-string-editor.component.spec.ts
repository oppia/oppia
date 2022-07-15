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
 * @fileoverview Uni tests for code string editor.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CodeStringEditorComponent } from './code-string-editor.component';

describe('CodeStringEditorComponent', () => {
  let component: CodeStringEditorComponent;
  let fixture: ComponentFixture<CodeStringEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CodeStringEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeStringEditorComponent);
    component = fixture.componentInstance;
  });

  it('should initialise then value', () => {
    component.ngOnInit();

    expect(component.value).toEqual('');
  });

  it('should initialise when user adds response', () => {
    component.value = 'test';
    component.ngOnInit();

    expect(component.value).toEqual('test');
    expect(component.warningText).toBe('');
  });

  it('should update value when user types in the text input box',
    fakeAsync(() => {
      spyOn(component.valueChanged, 'emit');
      component.value = 'test';
      component.ngOnInit();

      component.onEdit({
        target: {
          value: 'print(\'Hello\');'
        }
      });
      tick(60);

      expect(component.warningText).toBe('');
      expect(component.value).toBe('print(\'Hello\');');
      expect(component.valueChanged.emit)
        .toHaveBeenCalledWith('print(\'Hello\');');
    }));

  it('should warn user when user inserts a tab character', fakeAsync(() => {
    spyOn(component.valueChanged, 'emit');
    component.value = 'test';
    component.ngOnInit();

    component.onEdit({
      target: {
        value: '\tprint(\'Hello\');'
      }
    });
    tick(60);

    expect(component.warningText).toBe('Code may not contain tab characters.');
    expect(component.value).toBe('\tprint(\'Hello\');');
    expect(component.valueChanged.emit)
      .toHaveBeenCalledWith('\tprint(\'Hello\');');
  }));
});
