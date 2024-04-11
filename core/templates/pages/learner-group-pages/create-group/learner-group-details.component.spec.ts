// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for adding learner group details.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LearnerGroupDetailsComponent} from './learner-group-details.component';

describe('LearnerGroupDetailsComponent', () => {
  let component: LearnerGroupDetailsComponent;
  let fixture: ComponentFixture<LearnerGroupDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LearnerGroupDetailsComponent, MockTranslatePipe],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should update learner group title', () => {
    component.updateGroupTitle('Learner group title');
    expect(component.learnerGroupTitle).toEqual('Learner group title');
  });

  it('should update learner group description', () => {
    component.updateGroupDescription('Some description');
    expect(component.learnerGroupDescription).toEqual('Some description');
  });
});
