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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  CategorizedSkills,
  SelectSkillModalComponent,
} from './select-skill-modal.component';
import {SkillSelectorComponent} from './skill-selector.component';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {MaterialModule} from 'modules/material.module';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';
import {Subject} from 'rxjs';

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
    skill_model_created_on: 2,
    skill_model_last_updated: 3,
  };
  let shortSkillSummary: ShortSkillSummary =
    ShortSkillSummary.createFromBackendDict({
      skill_id: '3',
      skill_description: 'description3',
    });
  let categorizedSkills: CategorizedSkills = {
    'Dummy Topic': {
      Subtopic1: [shortSkillSummary],
      uncategorized: [],
    },
  };
  let untriagedSkillSummaries: SkillSummaryBackendDict[] = [
    skillSummaryBackendDict,
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
        HttpClientTestingModule,
      ],
      declarations: [SelectSkillModalComponent, SkillSelectorComponent],
      providers: [NgbActiveModal],
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
    let totalSkills: (SkillSummaryBackendDict | ShortSkillSummary)[] = [];
    if (componentInstance.skillSummaries) {
      totalSkills = [...componentInstance.skillSummaries];
    }
    if (componentInstance.untriagedSkillSummaries) {
      totalSkills.push(...componentInstance.untriagedSkillSummaries);
    }
    for (let topic in componentInstance.categorizedSkills) {
      for (let subtopic in componentInstance.categorizedSkills[topic]) {
        totalSkills.push(
          ...componentInstance.categorizedSkills[topic][subtopic]
        );
      }
    }
    let summary = totalSkills.find(
      summary => summary.id === componentInstance.selectedSkillId
    );

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
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: 'skillId2',
        skill_description: 'Skill Description',
      }),
    ];

    componentInstance.setSelectedSkillId('skillId1');
    expect(componentInstance.isSkillAlreadyLinked()).toBe(false);

    // Selecting a skill which is not already linked.
    componentInstance.setSelectedSkillId('skillId3');
    expect(componentInstance.isSkillAlreadyLinked()).toBe(true);
  });

  it('should keep Done button disabled when no skill is selected', () => {
    componentInstance.selectedSkillId = '';
    expect(componentInstance.isDoneButtonDisabled()).toBe(true);
  });

  it('should activate Done button when a skill is chosen', () => {
    componentInstance.selectedSkillId = 'skillId3';
    expect(componentInstance.isDoneButtonDisabled()).toBe(false);
  });

  it('should get empty grouped skill summaries', () => {
    expect(componentInstance.groupedSkillSummaries).toEqual({
      current: [],
      others: [],
    });
  });

  it('should get empty untriaged skill summaries for selector when absent', () => {
    componentInstance.untriagedSkillSummaries =
      undefined as unknown as SkillSummaryBackendDict[];

    expect(componentInstance.untriagedSkillSummariesForSelector).toEqual([]);
  });

  it('should map untriaged skill summaries for selector and cache them', () => {
    // First call creates the cache.
    const firstCall = componentInstance.untriagedSkillSummariesForSelector;
    expect(firstCall[0].id).toBe('3');

    // Second call returns the exact same array reference.
    const secondCall = componentInstance.untriagedSkillSummariesForSelector;
    expect(secondCall).toBe(firstCall);

    // Changing the underlying array should recreate the cache.
    componentInstance.untriagedSkillSummaries = [
      {
        id: '4',
        description: 'description4',
        language_code: 'language_code',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 2,
        skill_model_last_updated: 3,
      },
    ];
    const thirdCall = componentInstance.untriagedSkillSummariesForSelector;
    expect(thirdCall).not.toBe(firstCall);
    expect(thirdCall[0].id).toBe('4');
  });

  it('should clear untriaged skill summaries cache when set to undefined', () => {
    // Populate the cache first.
    expect(componentInstance.untriagedSkillSummariesForSelector.length).toBe(1);

    // Set to undefined.
    componentInstance.untriagedSkillSummaries =
      undefined as unknown as SkillSummaryBackendDict[];

    // Calling it should return an empty array and clear the cache.
    const undefinedCall = componentInstance.untriagedSkillSummariesForSelector;
    expect(undefinedCall).toEqual([]);

    // Successive calls should return the same empty array reference.
    const secondUndefinedCall =
      componentInstance.untriagedSkillSummariesForSelector;
    expect(secondUndefinedCall).toBe(undefinedCall);
  });
});

describe('Select Skill Modal in bottom sheet mode', () => {
  let fixture: ComponentFixture<SelectSkillModalComponent>;
  let componentInstance: SelectSkillModalComponent;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;
  let shortSkillSummary: ShortSkillSummary =
    ShortSkillSummary.createFromBackendDict({
      skill_id: '3',
      skill_description: 'description3',
    });
  let skillSummaryBackendDict: SkillSummaryBackendDict = {
    id: '3',
    description: 'description3',
    language_code: 'language_code',
    version: 1,
    misconception_count: 0,
    skill_model_created_on: 2,
    skill_model_last_updated: 3,
  };
  let categorizedSkills: CategorizedSkills = {
    'Dummy Topic': {
      Subtopic1: [shortSkillSummary],
      uncategorized: [],
    },
  };

  const configureWithData = (data: object) => {
    bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
      'keydownEvents',
    ]);
    bottomSheetRef.keydownEvents.and.returnValue(
      new Subject<KeyboardEvent>().asObservable()
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatRadioModule,
        MatCheckboxModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [SelectSkillModalComponent, SkillSelectorComponent],
      providers: [
        NgbActiveModal,
        {provide: MatBottomSheetRef, useValue: bottomSheetRef},
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: data},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectSkillModalComponent);
    componentInstance = fixture.componentInstance;
  };

  it('should set properties from the injected bottom sheet data', () => {
    configureWithData({
      categorizedSkills: categorizedSkills,
      skillsInSameTopicCount: 3,
      skillSummaries: [skillSummaryBackendDict],
      untriagedSkillSummaries: [skillSummaryBackendDict],
      allowSkillsFromOtherTopics: true,
      associatedSkillSummaries: [shortSkillSummary],
    });

    expect(componentInstance.categorizedSkills).toEqual(categorizedSkills);
    expect(componentInstance.skillsInSameTopicCount).toBe(3);
    expect(componentInstance.allowSkillsFromOtherTopics).toBe(true);
    expect(componentInstance.associatedSkillSummaries).toEqual([
      shortSkillSummary,
    ]);
  });

  it('should not set associated skill summaries when absent from data', () => {
    configureWithData({
      categorizedSkills: categorizedSkills,
      skillsInSameTopicCount: 3,
      skillSummaries: [skillSummaryBackendDict],
      untriagedSkillSummaries: [skillSummaryBackendDict],
      allowSkillsFromOtherTopics: false,
    });

    expect(componentInstance.allowSkillsFromOtherTopics).toBe(false);
    expect(componentInstance.associatedSkillSummaries).toBeUndefined();
  });
});
