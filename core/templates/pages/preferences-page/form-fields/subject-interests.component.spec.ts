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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MaterialModule } from 'components/material.module';
import { SubjectInterestsComponent } from './subject-interests.component';

describe('Preferences Page Component', () => {
  let componentInstance: SubjectInterestsComponent;
  let fixture: ComponentFixture<SubjectInterestsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
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

  it('should intialize', () => {
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
    componentInstance.ngOnInit();
    componentInstance.fruitInput = {
      nativeElement: {
        value: ''
      }
    };
    componentInstance.add({value: 'math'} as MatChipInputEvent);
    expect(componentInstance.subjectInterestsChange.emit).toHaveBeenCalled();
  });

  it('should remove subject interest', () => {
    componentInstance.subjectInterests = ['math'];
    componentInstance.ngOnInit();
    componentInstance.remove('math');
    expect(componentInstance.subjectInterests).toEqual([]);
  });

  it('should handle when user selects a subject interest', () => {
    spyOn(componentInstance, 'add');
    spyOn(componentInstance, 'remove');
    componentInstance.subjectInterests = ['math'];
    componentInstance.selected(
      { option: { viewValue: 'math' }} as MatAutocompleteSelectedEvent);
    expect(componentInstance.remove).toHaveBeenCalled();
    expect(componentInstance.add).not.toHaveBeenCalled();
    componentInstance.subjectInterests = [];
    componentInstance.selected(
      { option: { viewValue: 'math' }} as MatAutocompleteSelectedEvent);
    expect(componentInstance.add).toHaveBeenCalled();
  });
});
