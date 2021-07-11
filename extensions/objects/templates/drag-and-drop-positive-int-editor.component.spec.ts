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
 * @fileoverview Unit tests for drag and drop positive int editor.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DragAndDropPositiveIntEditorComponent } from './drag-and-drop-positive-int-editor.component';

describe('DragAndDropPositiveIntEditorComponent', () => {
  let component: DragAndDropPositiveIntEditorComponent;
  let fixture: ComponentFixture<DragAndDropPositiveIntEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DragAndDropPositiveIntEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DragAndDropPositiveIntEditorComponent);
    component = fixture.componentInstance;

    component.initArgs = {
      choices: ['opt1', 'opt2', 'opt3']
    };
  });

  it('should initialise when user interacts drag and drop interaction', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.value).toBe(1);
    expect(component.selectedRank).toBe('');
    expect(component.valueChanged.emit).toHaveBeenCalledWith(1);
    expect(component.allowedRanks).toEqual([1, 2, 3]);
    expect(component.choices).toEqual(['opt1', 'opt2', 'opt3']);
  });

  it('should use old rank and value if already present', () => {
    component.value = 2;
    component.selectedRank = '1';

    component.ngOnInit();

    expect(component.value).toBe(2);
    expect(component.selectedRank).toBe('1');
  });

  it('should update value when user changes rank of choice', () => {
    spyOn(component.valueChanged, 'emit');
    component.value = 1;

    component.selection('2');

    expect(component.value).toBe(2);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(2);
  });
});
