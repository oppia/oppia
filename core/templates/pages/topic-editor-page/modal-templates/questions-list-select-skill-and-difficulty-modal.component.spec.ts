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
 * @fileoverview Unit tests for questions list select
 * skill and difficulty modal component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillDifficulty} from 'domain/skill/skill-difficulty.model';
import {QuestionsListSelectSkillAndDifficultyModalComponent} from './questions-list-select-skill-and-difficulty-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Questions List Select Skill And Difficulty Modal Component', () => {
  let component: QuestionsListSelectSkillAndDifficultyModalComponent;
  let fixture: ComponentFixture<QuestionsListSelectSkillAndDifficultyModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  let allSkillSummaries = [
    {
      id: '1',
      description: 'Skill 1 description',
      language_code: 'en',
      version: 1,
      misconception_count: 2,
      worked_examples_count: 2,
      skill_model_created_on: 2,
      skill_model_last_updated: 2,
    },
    {
      id: '2',
      description: 'Skill 2 description',
      language_code: 'en',
      version: 1,
      misconception_count: 2,
      worked_examples_count: 2,
      skill_model_created_on: 2,
      skill_model_last_updated: 2,
    },
    {
      id: '3',
      description: 'Skill 3 description',
      language_code: 'en',
      version: 1,
      misconception_count: 2,
      worked_examples_count: 2,
      skill_model_created_on: 2,
      skill_model_last_updated: 2,
    },
  ];
  let countOfSkillsToPrioritize = 2;
  let currentMode: string;
  let linkedSkillsWithDifficulty: SkillDifficulty[] = [];
  let skillIdToRubricsObject = {};

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [QuestionsListSelectSkillAndDifficultyModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      QuestionsListSelectSkillAndDifficultyModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    allSkillSummaries.map(summary =>
      ShortSkillSummary.create(summary.id, summary.description)
    );

    component.allSkillSummaries = allSkillSummaries;
    component.countOfSkillsToPrioritize = countOfSkillsToPrioritize;
    component.currentMode = currentMode;
    component.linkedSkillsWithDifficulty = linkedSkillsWithDifficulty;
    component.skillSummaries = allSkillSummaries;
    component.skillIdToRubricsObject = skillIdToRubricsObject;
    fixture.detectChanges();
  });

  it(
    'should initialize component properties after component' +
      ' is initialized',
    () => {
      expect(component.countOfSkillsToPrioritize).toBe(
        countOfSkillsToPrioritize
      );
      expect(component.instructionMessage).toBe(
        'Select the skill(s) to link the question to:'
      );
      expect(component.currentMode).toBe(currentMode);
      expect(component.linkedSkillsWithDifficulty).toEqual(
        linkedSkillsWithDifficulty
      );
      expect(component.skillSummaries).toBe(allSkillSummaries);
      expect(component.skillSummariesInitial.length).toBe(2);
      expect(component.skillSummariesFinal.length).toBe(1);
      expect(component.skillIdToRubricsObject).toEqual(skillIdToRubricsObject);
    }
  );

  it('should toggle skill selection when clicking on it', () => {
    expect(component.linkedSkillsWithDifficulty.length).toBe(0);

    let summary = allSkillSummaries[0];
    component.selectOrDeselectSkill(summary);

    expect(component.isSkillSelected(summary.id)).toBe(true);
    expect(component.linkedSkillsWithDifficulty.length).toBe(1);

    component.selectOrDeselectSkill(summary);

    expect(component.isSkillSelected(summary.id)).toBe(false);
    expect(component.linkedSkillsWithDifficulty.length).toBe(0);
  });

  it('should change view mode to select skill when changing view', () => {
    expect(component.currentMode).toBe(currentMode);

    component.goToSelectSkillView();

    expect(component.currentMode).toBe('MODE_SELECT_SKILL');
  });

  it('should change view mode to select difficulty after selecting a skill', () => {
    expect(component.currentMode).toBe(currentMode);

    component.goToNextStep();

    expect(component.currentMode).toBe('MODE_SELECT_DIFFICULTY');
  });

  it('should select skill and its difficulty properly when closing the modal', () => {
    spyOn(ngbActiveModal, 'close');
    let summary = allSkillSummaries[1];
    component.selectOrDeselectSkill(summary);

    component.startQuestionCreation();

    expect(ngbActiveModal.close).toHaveBeenCalledWith([
      SkillDifficulty.create(
        allSkillSummaries[1].id,
        allSkillSummaries[1].description,
        0.6
      ),
    ]);

    // Remove summary to not affect other specs.
    component.selectOrDeselectSkill(summary);
  });

  it('should change the skill difficulty', () => {
    let summary = allSkillSummaries[0];
    component.selectOrDeselectSkill(summary);

    let newSummary = allSkillSummaries[1];
    let newSkilldifficulty = SkillDifficulty.create(
      newSummary.id,
      newSummary.description,
      0.6
    );

    component.changeSkillWithDifficulty(newSkilldifficulty, 0);

    expect(component.linkedSkillsWithDifficulty.length).toBe(1);
    expect(component.linkedSkillsWithDifficulty).toEqual([newSkilldifficulty]);

    component.selectOrDeselectSkill(newSummary);
  });

  it('should filter the skills', () => {
    component.filterSkills('Skill 1 description');

    expect(component.skillsToShow.length).toBe(1);
  });
});
