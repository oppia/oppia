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
 * @fileoverview Unit tests for SchemaBasedChoicesEditorComponent
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SchemaBasedChoicesEditorComponent } from './schema-based-choices-editor.component';

describe('Schema Based Choices Editor Component', () => {
  let componentInstance: SchemaBasedChoicesEditorComponent;
  let fixture: ComponentFixture<SchemaBasedChoicesEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SchemaBasedChoicesEditorComponent],
      imports: [FormsModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedChoicesEditorComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should return readonly schema', () => {
    componentInstance.schema = {
      type: 'choices',
      choices: [1, 2, 3]
    };
    expect(componentInstance.getReadOnlySchema()).toEqual({type: 'choices'});
  });

  it('should updateLocalValue', () => {
    spyOn(componentInstance.localValueChange, 'emit');
    componentInstance.updateLocalValue();
    expect(componentInstance.localValueChange.emit).toHaveBeenCalled();
  });
});
