// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AddMisconceptionModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MisconceptionObjectFactory} from 'domain/skill/MisconceptionObjectFactory';
import {Skill, SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {AddMisconceptionModalComponent} from './add-misconception-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Misconception Modal Component', function () {
  let component: AddMisconceptionModalComponent;
  let fixture: ComponentFixture<AddMisconceptionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;
  let skillObject: Skill;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AddMisconceptionModalComponent],
      providers: [
        SkillEditorStateService,
        ChangeDetectorRef,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMisconceptionModalComponent);
    component = fixture.componentInstance;
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    let misconceptionDict1 = {
      id: 2,
      name: 'test name 2',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };
    let misconceptionDict2 = {
      id: 3,
      name: 'test name 3',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };
    let rubricDict = {
      difficulty: 'easy',
      explanations: ['explanation'],
    };
    let skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {},
      },
    };
    skillObject = skillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 3,
      prerequisite_skill_ids: ['skill_1'],
      all_questions_merged: true,
      superseding_skill_id: 'skill',
    });

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skillObject);
    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.skill).toEqual(skillObject);
    expect(component.misconceptionName).toBe('');
    expect(component.misconceptionNotes).toBe('');
    expect(component.misconceptionFeedback).toBe('');
    expect(component.misconceptionMustBeAddressed).toBe(true);
    expect(component.misconceptionNameIsDuplicate).toBe(false);
    expect(component.existingMisconceptionNames).toEqual([
      'test name 2',
      'test name 3',
    ]);
  });

  it('should save misconception when closing the modal', () => {
    spyOn(ngbActiveModal, 'close');

    component.saveMisconception();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      misconception: misconceptionObjectFactory.create(3, '', '', '', true),
    });
  });

  it('should not allow a misconception with a duplicate name', () => {
    // 'test name 2' is a duplicate name from a previous misconception.
    spyOn(ngbActiveModal, 'close');

    component.misconceptionName = 'test name 2';
    component.misconceptionNotes = 'unique notes';
    component.misconceptionFeedback = 'unique feedback';
    component.misconceptionMustBeAddressed = true;
    component.checkIfMisconceptionNameIsDuplicate();
    component.saveMisconception();

    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should get schema for form', () => {
    expect(component.getSchemaForm()).toEqual(
      component.MISCONCEPTION_PROPERTY_FORM_SCHEMA
    );
  });

  it('should get schema for feedback', () => {
    expect(component.getSchemaFeedback()).toEqual(
      component.MISCONCEPTION_FEEDBACK_PROPERTY_FORM_SCHEMA
    );
  });

  it('should update misconceptionNotes', () => {
    let notes = 'notes';
    component.ngOnInit();

    component.updateLocalForm(notes);

    expect(component.misconceptionNotes).toEqual(notes);
  });

  it('should update misconceptionFeedback', () => {
    let feedback = 'feedback';
    component.ngOnInit();

    component.updateLocalFeedback(feedback);

    expect(component.misconceptionFeedback).toEqual(feedback);
  });
});
