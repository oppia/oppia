// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for DeleteMisconceptionModalController.
 */

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DeleteMisconceptionModalComponent } from './delete-misconception-modal.component';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { AppConstants } from 'app.constants';

class MockActiveModal {
  close(value: string): void {
    return;
  }
}

describe('Delete Misconception Modal Component', () => {
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;
  let skillObject: Skill;
  let index = 0;
  let component: DeleteMisconceptionModalComponent;
  let fixture: ComponentFixture<DeleteMisconceptionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let closeSpy: jasmine.Spy;

  class MockSkillEditorStateService {
    getSkill(): Skill {
      return skillObject;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteMisconceptionModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: SkillEditorStateService,
          useClass: MockSkillEditorStateService
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DeleteMisconceptionModalComponent);
    component = fixture.componentInstance;
    component.index = index;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    let misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    let rubricDict = {
      difficulty: AppConstants.SKILL_DIFFICULTIES[0],
      explanations: ['explanation']
    };

    let skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    };

    skillObject = skillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 3,
      prerequisite_skill_ids: ['skill_1'],
      superseding_skill_id: 'skill0',
      all_questions_merged: true
    });

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skillObject);
    component.ngOnInit();
  }));

  it('should initialize properties after component is initialized',
    () => {
      expect(component.skill).toEqual(skillObject);
    });

  it('should close the modal with misconception id when clicking on save' +
    ' button', () => {
    component.confirm();
    expect(closeSpy).toHaveBeenCalledWith({
      id: 2
    });
  });
});
