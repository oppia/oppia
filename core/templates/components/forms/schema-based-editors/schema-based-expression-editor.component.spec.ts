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
 * @fileoverview Unit tests for SchemaBasedExpressionEditorComponent
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SchemaBasedExpressionEditorComponent } from './schema-based-expression-editor.component';
describe('Schema Based Expression Editor Component', () => {
  let componentInstance: SchemaBasedExpressionEditorComponent;
  let fixture: ComponentFixture<SchemaBasedExpressionEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SchemaBasedExpressionEditorComponent],
      imports: [FormsModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedExpressionEditorComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should updateLocalValue', () => {
    spyOn(componentInstance.localValueChange, 'emit');
    componentInstance.updateLocalValue();
    expect(componentInstance.localValueChange.emit).toHaveBeenCalled();
  });
});
