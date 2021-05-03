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

import { NgZone, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import CodeMirror from 'node_modules/@types/codemirror';
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
    const zone: NgZone = TestBed.inject(NgZone);
    spyOn(zone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
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
    const mergeView = (...args: unknown[]): void => {
      mergeViewCalled = true;
    };
    const mockCodeMirror: typeof CodeMirror = {
      MergeView: mergeView
    } as unknown as typeof CodeMirror;
    window.CodeMirror = mockCodeMirror;
    component.ngAfterViewInit();
    expect(mergeViewCalled).toBe(true);
    window.CodeMirror = originalCodeMirror;
  });

  it('should not allow undefined for left or right pane', () => {
    const editSetValueSpy = jasmine.createSpy('editSetValueSpy');
    const rightOrgSetValueSpy = jasmine.createSpy('rightOrgSetValueSpy');
    component.codeMirrorInstance = {
      editor: () => {
        return {setValue: editSetValueSpy} as unknown as CodeMirror.Editor;
      },
      rightOriginal: () => {
        return {setValue: rightOrgSetValueSpy} as unknown as CodeMirror.Editor;
      }
    } as unknown as CodeMirror.MergeView.MergeViewEditor;
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
      editor: () => {
        return {setValue: editSetValueSpy} as unknown as CodeMirror.Editor;
      },
      rightOriginal: () => {
        return {setValue: rightOrgSetValueSpy} as unknown as CodeMirror.Editor;
      }
    } as unknown as CodeMirror.MergeView.MergeViewEditor;
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
