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
 * @fileoverview Unit tests for SelectSkillModalComponent.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategorizedSkills, SelectSkillModalComponent } from './select-skill-modal.component';
import { SkillSelectorComponent } from './skill-selector.component';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { MaterialModule } from 'modules/material.module';


describe('Select Skill Modal', () => {
  let fixture: ComponentFixture<SelectSkillModalComponent>;
  let componentInstance: SelectSkillModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let allowSkillsFromOtherTopics: boolean;
  let skillsInSameTopicCount: number = 3;
  let skillSummaryBackendDict: SkillSummaryBackendDict = {
    id: '3',
    description: 'description3',
    language_code: 'language_code',
    version: 1,
    misconception_count: 0,
    worked_examples_count: 0,
    skill_model_created_on: 2,
    skill_model_last_updated: 3
  };
  let shortSkillSummary: SkillSummaryBackendDict = skillSummaryBackendDict;
  let categorizedSkills: CategorizedSkills = {
    'Dummy Topic': {
      Subtopic1: [shortSkillSummary]
    }
  };
  let untriagedSkillSummaries: SkillSummaryBackendDict[] = [
    skillSummaryBackendDict
  ];
  let skillSummaries: SkillSummaryBackendDict[] = [skillSummaryBackendDict];
  let associatedSkillSummaries: ShortSkillSummary[];


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatRadioModule,
        MatCheckboxModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        SelectSkillModalComponent,
        SkillSelectorComponent
      ],
      providers: [
        NgbActiveModal
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectSkillModalComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.allowSkillsFromOtherTopics = allowSkillsFromOtherTopics;
    componentInstance.categorizedSkills = categorizedSkills;
    componentInstance.skillsInSameTopicCount = skillsInSameTopicCount;
    componentInstance.skillSummaries = skillSummaries;
    componentInstance.untriagedSkillSummaries = untriagedSkillSummaries;
    componentInstance.associatedSkillSummaries = associatedSkillSummaries;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should close modal on confirm', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.selectedSkillId = '2';
    let totalSkills: SkillSummaryBackendDict[] = [];
    if (componentInstance.skillSummaries) {
      totalSkills = [...componentInstance.skillSummaries];
    }
    if (componentInstance.untriagedSkillSummaries) {
      totalSkills.push(...componentInstance.untriagedSkillSummaries);
    }
    for (let topic in componentInstance.categorizedSkills) {
      for (let subtopic in componentInstance.categorizedSkills[topic]) {
        totalSkills.push(
          ...componentInstance.categorizedSkills[topic][subtopic]);
      }
    }
    let summary = totalSkills.find(
      summary => summary.id === componentInstance.selectedSkillId);

    componentInstance.confirm();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(summary);
  });

  it('should set selected skill id', () => {
    componentInstance.setSelectedSkillId('skill_id');
    expect(componentInstance.selectedSkillId).toEqual('skill_id');
  });

  it('should disable Save button if skill is already linked', () => {
    componentInstance.associatedSkillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId1',
        skill_description: 'Skill Description'
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description'
      })
    ];

    componentInstance.setSelectedSkillId('skillId1');
    expect(componentInstance.isSaveButtonEnabled()).toBe(false);

    // Selecting a skill which is not already linked.
    componentInstance.setSelectedSkillId('skillId3');
    expect(componentInstance.isSaveButtonEnabled()).toBe(true);
  });
});
