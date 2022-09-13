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
 * @fileoverview Unit tests for the change subtopic assignment modal.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChangeSubtopicAssignmentModalComponent } from './change-subtopic-assignment-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subtopic } from 'domain/topic/subtopic.model';

describe('Change subtopic assignment modal', () => {
  let component: ChangeSubtopicAssignmentModalComponent;
  let fixture: ComponentFixture<ChangeSubtopicAssignmentModalComponent>;

  let subtopics: Subtopic[] = [];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeSubtopicAssignmentModalComponent],
      providers: [
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeSubtopicAssignmentModalComponent);
    component = fixture.componentInstance;
    component.subtopics = subtopics;
  });

  it('should initialize component properties after component is initialized',
    function() {
      component.ngOnInit();

      expect(component.subtopics).toEqual(subtopics);
      expect(component.selectedSubtopicId).toEqual(null);
    });

  it('should change the selected subtopic index', function() {
    // Setup.
    component.changeSelectedSubtopic(10);
    // Pre-check.
    expect(component.selectedSubtopicId).toEqual(10);
    // Action.
    component.changeSelectedSubtopic(3);
    // Post-check.
    expect(component.selectedSubtopicId).toEqual(3);
  });
});
