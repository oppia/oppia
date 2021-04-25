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
 * @fileoverview Unit tests for angular code mirror wrapper.
 */

import { SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CodemirrorMergeviewComponent } from './codemirror-mergeview.component';

describe('Oppia CodeMirror Component', () => {
  let component: CodemirrorMergeviewComponent;
  let fixture: ComponentFixture<CodemirrorMergeviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CodemirrorMergeviewComponent]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CodemirrorMergeviewComponent);
    component = fixture.componentInstance;
  }));

  it('should throw error if codemirror is undefined', () => {
    const originalCodeMirror = window.CodeMirror;
    window.CodeMirror = undefined;
    expect(() => {
      component.ngOnInit();
    }).toThrowError('CodeMirror not found.');
    window.CodeMirror = originalCodeMirror;
  });

  it('should call merge view', () => {
    const originalCodeMirror = window.CodeMirror;
    let mergeViewCalled = false;
    const mergeView = class {
      constructor() {
        mergeViewCalled = true;
      }
    };
    window.CodeMirror = (
      {
        MergeView: mergeView
      } as unknown as typeof import('node_modules/@types/codemirror'));
    component.ngOnInit();
    expect(mergeViewCalled).toBe(true);
    window.CodeMirror = originalCodeMirror;
  });

  it('should not allow undefined for left or right pane', () => {
    const editSetValueSpy = jasmine.createSpy('editSetValueSpy');
    const rightOrgSetValueSpy = jasmine.createSpy('rightOrgSetValueSpy');
    component.codeMirrorInstance = {
      edit: {setValue: editSetValueSpy},
      right: {orig: {setValue: rightOrgSetValueSpy}}
    };
    let changes: SimpleChanges = {
      leftValue: {
        currentValue: undefined,
        previousValue: 'B',
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.leftValue = undefined;
    expect(() => component.ngOnChanges(changes)).toThrowError(
      'Left pane value is not defined.'
    );
    changes = {
      rightValue: {
        currentValue: undefined,
        previousValue: 'B',
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.rightValue = undefined;
    expect(() => component.ngOnChanges(changes)).toThrowError(
      'Right pane value is not defined.'
    );
  });

  it('should not allow undefined for left or right pane', () => {
    const editSetValueSpy = jasmine.createSpy('editSetValueSpy');
    const rightOrgSetValueSpy = jasmine.createSpy('rightOrgSetValueSpy');
    component.codeMirrorInstance = {
      edit: {setValue: editSetValueSpy},
      right: {orig: {setValue: rightOrgSetValueSpy}}
    };
    const changes: SimpleChanges = {
      leftValue: {
        currentValue: 'A',
        previousValue: 'B',
        firstChange: false,
        isFirstChange: () => false
      },
      rightValue: {
        currentValue: 'D',
        previousValue: 'C',
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.leftValue = 'A';
    component.rightValue = 'D';
    component.ngOnChanges(changes);
    expect(editSetValueSpy).toHaveBeenCalledWith('A');
    expect(rightOrgSetValueSpy).toHaveBeenCalledWith('D');
  });
});
