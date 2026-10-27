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

import {NO_ERRORS_SCHEMA, SimpleChanges} from '@angular/core';
import {waitForAsync, TestBed} from '@angular/core/testing';
import {FilepathEditorComponent} from './filepath-editor.component';

/**
 * @fileoverview Unit tests for the File path editor.
 */

describe('File path editor', () => {
  let component: FilepathEditorComponent;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FilepathEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));
  beforeEach(() => {
    component = TestBed.createComponent(
      FilepathEditorComponent
    ).componentInstance;
  });

  it('should show svg editor when filepath represents an svg', () => {
    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeFalse();

    component.value = '/path/to/svg-image.svg';
    component.ngOnInit();

    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeTrue();
  });

  it('should show image editor when filepath does not represent an svg', () => {
    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeFalse();

    component.value = '/path/to/png-image.png';
    component.ngOnInit();

    expect(component.imageEditorIsShown).toBeTrue();
    expect(component.svgEditorIsShown).toBeFalse();
  });

  it('should cause the form to be invalid when filepath is empty', () => {
    spyOn(component.validityChange, 'emit');

    component.value = '';
    component.ngOnInit();

    expect(component.validityChange.emit).toHaveBeenCalledWith({empty: false});
  });

  it('should detect change in value', () => {
    spyOn(component.valueChanged, 'emit');

    component.valueHasChanged('new value');

    expect(component.valueChanged.emit).toHaveBeenCalledWith('new value');
  });

  it('should detect change in validity', () => {
    spyOn(component.validityChange, 'emit');

    component.validityHasChanged({empty: false});

    expect(component.validityChange.emit).toHaveBeenCalledWith({empty: false});
  });

  it('should reset the editor when discard button is clicked', () => {
    spyOn(component.validityChange, 'emit');

    component.resetEditor();

    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeFalse();
    expect(component.value).toEqual('');
    expect(component.validityChange.emit).toHaveBeenCalledWith({empty: false});
  });

  it('should display image editor when upload button is clicked', () => {
    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeFalse();

    component.onClickUploadImage();

    expect(component.imageEditorIsShown).toBeTrue();
    expect(component.svgEditorIsShown).toBeFalse();
  });

  it('should display svg editor when create button is clicked', () => {
    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeFalse();

    component.onClickCreateImage();

    expect(component.imageEditorIsShown).toBeFalse();
    expect(component.svgEditorIsShown).toBeTrue();
  });

  it('should reinitialise when the value changes', () => {
    spyOn(component, 'ngOnInit');
    const changes: SimpleChanges = {
      value: {
        currentValue: '/path/to/svg-image.svg',
        previousValue: undefined,
        firstChange: false,
        isFirstChange: () => false,
      },
    };

    component.ngOnChanges(changes);

    expect(component.ngOnInit).toHaveBeenCalled();
  });
});
