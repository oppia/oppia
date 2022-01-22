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
 * @fileoverview Unit tests for the subject interests component.
 */

import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { SubjectInterestsComponent } from './subject-interests.component';

describe('Subject interests form field Component', () => {
  let componentInstance: SubjectInterestsComponent;
  let fixture: ComponentFixture<SubjectInterestsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        MockTranslatePipe,
        SubjectInterestsComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectInterestsComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    fixture.detectChanges();
    let input = '';
    componentInstance.subjectInterests = ['math'];
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe: (callb: (value: string) => void) => {
          callb(input);
        }
      }
    } as FormControl;
    componentInstance.ngOnInit();
    input = 'math';
    componentInstance.formCtrl = {
      valueChanges: {
        subscribe(callb: (val: string) => void) {
          callb(input);
        }
      }
    } as FormControl;
    componentInstance.ngOnInit();
    expect(componentInstance.allSubjectInterests).toEqual(
      componentInstance.subjectInterests);
  });

  it('should validate input', () => {
    componentInstance.subjectInterests = [];
    expect(componentInstance.validInput('math')).toBeTrue();
  });

  it('should add subject interest', () => {
    spyOn(componentInstance.subjectInterestsChange, 'emit');
    spyOn(componentInstance, 'validInput').and.returnValue(true);
    componentInstance.subjectInterests = [];
    componentInstance.allSubjectInterests = [];
    componentInstance.subjectInterestInput = {
      nativeElement: {
        value: ''
      }
    } as ElementRef;
    componentInstance.add({value: 'math'});
    componentInstance.add({value: ''});
    expect(componentInstance.subjectInterestsChange.emit).toHaveBeenCalled();
  });

  it('should remove subject interest', () => {
    componentInstance.subjectInterests = ['math'];
    componentInstance.allSubjectInterests = ['math'];
    componentInstance.remove('math');
    expect(componentInstance.subjectInterests).toEqual([]);
  });

  it('should handle when user selects a subject interest', () => {
    spyOn(componentInstance, 'add');
    spyOn(componentInstance, 'remove');
    componentInstance.subjectInterests = ['math'];
    componentInstance.selected(
      { option: { value: 'math' }});
    expect(componentInstance.remove).toHaveBeenCalled();
    expect(componentInstance.add).not.toHaveBeenCalled();
    componentInstance.subjectInterests = [];
    componentInstance.selected(
      { option: { value: 'math' }});
    expect(componentInstance.add).toHaveBeenCalled();
  });

  it('should filter interests', () => {
    componentInstance.allSubjectInterests = ['math'];
    expect(componentInstance.filter('math')).toEqual(['math']);
    expect(componentInstance.filter('art')).toEqual([]);
  });
});
