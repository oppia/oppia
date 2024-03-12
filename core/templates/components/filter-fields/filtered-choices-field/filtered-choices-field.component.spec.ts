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
 * @fileoverview Unit tests for the filtered choices field component.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {FilteredChoicesFieldComponent} from './filtered-choices-field.component';

describe('Filtered Choices Field Component', () => {
  let componentInstance: FilteredChoicesFieldComponent;
  let fixture: ComponentFixture<FilteredChoicesFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, MaterialModule, FormsModule],
      declarations: [FilteredChoicesFieldComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilteredChoicesFieldComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.choices = ['choice1'];
    componentInstance.ngOnInit();
    expect(componentInstance.filteredChoices).toEqual(
      componentInstance.choices
    );
  });

  it('should filter choices', () => {
    componentInstance.choices = ['choice 1', 'choice 2'];
    componentInstance.filterChoices('2');
    expect(componentInstance.filteredChoices).toEqual(['choice 2']);
  });

  it('should update selection', () => {
    componentInstance.updateSelection('selection1');
    expect(componentInstance.selection).toEqual('selection1');
  });
});
