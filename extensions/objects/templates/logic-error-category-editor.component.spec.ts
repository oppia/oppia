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
 * @fileoverview Unit tests for logic error category editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { LogicErrorCategoryEditorComponent } from './logic-error-category-editor.component';

describe('LogicErrorCategoryEditorComponent', () => {
  let component: LogicErrorCategoryEditorComponent;
  let fixture: ComponentFixture<LogicErrorCategoryEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LogicErrorCategoryEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogicErrorCategoryEditorComponent);
    component = fixture.componentInstance;
  });

  it('should initialise component', () => {
    component.ngOnInit();

    expect(component.category).toEqual({
      name: 'parsing',
      humanReadable: 'Unparseable'
    });
  });

  it('should set and get error category when called', () => {
    spyOn(component.valueChanged, 'emit');
    component.category = {
      name: 'typing',
      humanReadable: 'Ill-typed'
    };

    expect(component.category).toEqual({
      name: 'typing',
      humanReadable: 'Ill-typed'
    });

    expect(component.valueChanged.emit).toHaveBeenCalledWith({
      name: 'typing',
      humanReadable: 'Ill-typed'
    });
  });
});
