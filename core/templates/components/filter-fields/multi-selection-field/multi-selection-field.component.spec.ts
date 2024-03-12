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
 * @fileoverview Unit tests for the multi selection field component.
 */

import {ElementRef} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {MultiSelectionFieldComponent} from './multi-selection-field.component';

describe('Multi Selection Field Component', () => {
  let componentInstance: MultiSelectionFieldComponent;
  let fixture: ComponentFixture<MultiSelectionFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [MultiSelectionFieldComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiSelectionFieldComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    fixture.detectChanges();
    let input = '';
    componentInstance.selections = ['selection 1'];
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe: (callb: (value: string) => void) => {
          callb(input);
        },
      },
    } as FormControl;
    componentInstance.ngOnInit();
    input = 'selection 1';
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe(callb: (val: string) => void) {
          callb(input);
        },
      },
    } as FormControl;
    componentInstance.ngOnInit();
    expect(componentInstance.readOnlySelections).toEqual(
      componentInstance.selections
    );
  });

  it('should validate input', () => {
    componentInstance.selections = [];
    componentInstance.allowLowercaseOnly = true;
    expect(componentInstance.validateInput('SELECTION 1')).toBeFalse();
    componentInstance.allowLowercaseOnly = false;
    expect(componentInstance.validateInput('SELECTION 1')).toBeTrue();
    expect(componentInstance.validateInput('selection 1')).toBeTrue();
  });

  it('should add subject interest', () => {
    spyOn(componentInstance.selectionsChange, 'emit');
    spyOn(componentInstance, 'validateInput').and.returnValue(true);
    componentInstance.selections = [];
    componentInstance.readOnlySelections = [];
    componentInstance.newSelectionInput = {
      nativeElement: {
        value: '',
      },
    } as ElementRef;
    componentInstance.add({value: 'math'});
    componentInstance.add({value: ''});
    expect(componentInstance.selectionsChange.emit).toHaveBeenCalled();
  });

  it('should remove subject interest', () => {
    componentInstance.selections = ['selection 1'];
    componentInstance.readOnlySelections = ['selection 1'];
    componentInstance.remove('selection 1');
    expect(componentInstance.selections).toEqual([]);
  });

  it('should handle when user selects a subject interest', () => {
    spyOn(componentInstance, 'add');
    spyOn(componentInstance, 'remove');
    componentInstance.selections = ['selection 1'];
    componentInstance.selected({option: {value: 'selection 1'}});
    expect(componentInstance.remove).toHaveBeenCalled();
    expect(componentInstance.add).not.toHaveBeenCalled();
    componentInstance.selections = [];
    componentInstance.selected({option: {value: 'selection 1'}});
    expect(componentInstance.add).toHaveBeenCalled();
  });

  it('should filter interests', () => {
    componentInstance.readOnlySelections = ['selection 1'];
    expect(componentInstance.filter('selection 1')).toEqual(['selection 1']);
    expect(componentInstance.filter('art')).toEqual([]);
  });
});
