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
 * @fileoverview Unit test for HTML editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlEditorComponent } from './html-editor.component';

describe('HtmlEditorComponent', () => {
  let component: HtmlEditorComponent;
  let fixture: ComponentFixture<HtmlEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HtmlEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should update value when user enters a new value', () => {
    spyOn(component.valueChanged, 'emit');

    expect(component.value).toBeUndefined();

    component.updateValue('test');

    expect(component.value).toBe('test');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('test');
  });
});
