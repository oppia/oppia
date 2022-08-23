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
 * @fileoverview Unit tests for Subtitled Html editor.
 */

import { ChangeDetectorRef } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledHtmlEditorComponent } from './subtitled-html-editor.component';

describe('SubtitledHtmlEditorComponent', () => {
  let component: SubtitledHtmlEditorComponent;
  let fixture: ComponentFixture<SubtitledHtmlEditorComponent>;
  let mockValue = new SubtitledHtml('<p>test</p>', null);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubtitledHtmlEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtitledHtmlEditorComponent);
    component = fixture.componentInstance;

    component.schema = {
      replacement_ui_config: {
        html: {
          hide_complex_extensions: true,
          placeholder: 'Enter an option for the learner to select'
        }
      }
    };
  });

  it('should initialise when user types text', () => {
    component.ngOnInit();

    expect(component.getSchema()).toEqual({
      type: 'html',
      ui_config: {
        html: {
          hide_complex_extensions: true,
          placeholder: 'Enter an option for the learner to select'
        }
      }
    });
  });

  it('should return SCHEMA when called', () => {
    component.SCHEMA = {
      type: 'html',
      ui_config: {
        html: {
          hide_complex_extensions: true,
          placeholder: 'Enter an option for the learner to select'
        }
      }
    };

    expect(component.getSchema()).toEqual({
      type: 'html',
      ui_config: {
        html: {
          hide_complex_extensions: true,
          placeholder: 'Enter an option for the learner to select'
        }
      }
    });
  });

  it('should update the value when user edits a text', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
    fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');

    component.value = mockValue;

    component.updateValue('<p>new test</p>');

    expect(component.value).toEqual(
      new SubtitledHtml('<p>new test</p>', null)
    );
    expect(component.valueChanged.emit).toHaveBeenCalledWith(mockValue);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not replace value when user did not change it', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
    fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.value = mockValue;
    component.value._html = '<p>test</p>';

    component.updateValue('<p>test</p>');

    expect(component.value).toEqual(mockValue);
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith(mockValue);
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });
});
