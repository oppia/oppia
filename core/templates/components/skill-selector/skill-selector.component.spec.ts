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
 * @fileoverview Unit tests for SkillSelectorComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {UserService} from 'services/user.service';
import {FilterForMatchingSubstringPipe} from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import {SkillSelectorComponent} from './skill-selector.component';
import {SkillFilteringService} from 'domain/skill/skill-filtering.service';

describe('SkillSelectorComponent', () => {
  let component: SkillSelectorComponent;
  let fixture: ComponentFixture<SkillSelectorComponent>;
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SkillSelectorComponent],
      providers: [
        UserService,
        FilterForMatchingSubstringPipe,
        SkillFilteringService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillSelectorComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  beforeEach(() => {
    spyOn(userService, 'canUserAccessTopicsAndSkillsDashboard').and.returnValue(
      Promise.resolve(true)
    );
  });

  it('should initialize topic and subtopic filters to unchecked state', fakeAsync(() => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
        subtopic2: [ShortSkillSummary.create('skill3', 'Skill 3 description.')],
      },
    };

    expect(component.topicFilterList).toEqual([]);
    expect(component.subTopicFilterDict).toEqual({});

    component.ngOnInit();
    tick();

    expect(component.topicFilterList).toEqual([
      {
        topicName: 'topic1',
        checked: false,
      },
    ]);
    expect(component.subTopicFilterDict).toEqual({
      topic1: [
        {
          subTopicName: 'uncategorized',
          checked: false,
        },
        {
          subTopicName: 'subtopic1',
          checked: false,
        },
        {
          subTopicName: 'subtopic2',
          checked: false,
        },
      ],
    });
  }));

  it('should check if skill is empty', () => {
    let categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
        subtopic2: [],
      },
    };

    expect(component.checkIfEmpty(categorizedSkills.topic1.subtopic1)).toBe(
      false
    );
    expect(component.checkIfEmpty(categorizedSkills.topic1.subtopic2)).toBe(
      true
    );
  });

  it('should check if topic is empty', () => {
    component.currCategorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
      },
      topic2: {
        uncategorized: [],
      },
    };

    expect(component.checkTopicIsNotEmpty('topic1')).toBe(true);
    expect(component.checkTopicIsNotEmpty('topic2')).toBe(false);
  });

  it('should set selected skill Id when user clicks on radio button', () => {
    component.selectedSkill = 'skill1';
    spyOn(component.selectedSkillIdChange, 'emit');

    component.setSelectedSkillId();

    expect(component.selectedSkillIdChange.emit).toHaveBeenCalledWith('skill1');
  });

  it('should display subtopics from all topics in the subtopic filter if no topic is checked', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.'),
        ],
      },
    };

    component.ngOnInit();
    component.subTopicFilterDict = {};
    component.updateSkillsListOnTopicFilterChange();

    expect(component.subTopicFilterDict).toEqual({
      topic1: [
        {
          subTopicName: 'uncategorized',
          checked: false,
        },
        {
          subTopicName: 'subtopic1',
          checked: false,
        },
      ],
      topic2: [
        {
          subTopicName: 'uncategorized',
          checked: false,
        },
      ],
    });
  });

  it('should update skill list when user filters skills by only topics', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
        subtopic2: [ShortSkillSummary.create('skill3', 'Skill 3 description.')],
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.'),
        ],
        subtopic3: [ShortSkillSummary.create('skill5', 'Skill 5 description.')],
        subtopic4: [ShortSkillSummary.create('skill6', 'Skill 6 description.')],
      },
    };
    component.ngOnInit();

    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true,
      },
      {
        topicName: 'topic2',
        checked: false,
      },
    ];

    component.updateSkillsListOnTopicFilterChange();

    expect(component.currCategorizedSkills).toEqual({
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
        subtopic2: [ShortSkillSummary.create('skill3', 'Skill 3 description.')],
      },
    });
  });

  it('should search in subtopic skills and return filtered skills', () => {
    let inputShortSkillSummaries: ShortSkillSummary[] = [
      ShortSkillSummary.create('skill1', 'Skill 1 description.'),
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.'),
    ];
    let searchText = 'skill 2';

    expect(
      component.searchInSubtopicSkills(inputShortSkillSummaries, searchText)
    ).toEqual([
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.'),
    ]);
  });

  it('should search in untriaged skill summaries and return filtered skills', () => {
    component.untriagedSkillSummaries = [
      SkillSummary.createFromBackendDict({
        id: '1',
        description: 'This is untriaged skill summary 1',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'This is untriaged skill summary 2',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
    ];
    component.skillIdsToExclude = new Set(['1']);

    expect(
      component.searchInUntriagedSkillSummaries('skill summary 2')
    ).toEqual([
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'This is untriaged skill summary 2',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
    ]);
  });

  it('should trigger refreshFilterLists when skillFilterText changes', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
      },
    };
    component.ngOnInit();

    spyOn(component, 'refreshFilterLists');

    component.skillFilterText = 'new search';

    expect(component.refreshFilterLists).toHaveBeenCalled();
  });

  it('should clear all filters when user clicks on Clear All Filters', () => {
    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true,
      },
    ];
    component.subTopicFilterDict = {
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: true,
        },
      ],
    };

    component.clearAllFilters();

    expect(component.topicFilterList).toEqual([
      {
        topicName: 'topic1',
        checked: false,
      },
    ]);
    expect(component.subTopicFilterDict).toEqual({
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: false,
        },
      ],
    });
  });

  it('should filter augmented topics based on search text', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Algebra equation.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Geometry shapes.')],
      },
      topic2: {
        uncategorized: [ShortSkillSummary.create('skill3', 'Physics motion.')],
      },
    };

    component.ngOnInit();
    component.skillFilterText = 'Algebra';

    expect(component.augmentedTopicFilterList.length).toBe(1);
    expect(component.augmentedTopicFilterList[0].topicName).toBe('topic1');
  });

  it('should return all augmented topics when search text is empty', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
      },
    };
    component.ngOnInit();

    component.skillFilterText = 'Skill 1';
    expect(component.augmentedTopicFilterList.length).toBe(1);

    component.skillFilterText = '';
    expect(component.augmentedTopicFilterList.length).toBe(1);
  });

  it('should update skill list when user filters skills by topics and subtopics', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
        subtopic2: [ShortSkillSummary.create('skill3', 'Skill 3 description.')],
      },
    };

    component.ngOnInit();

    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true,
      },
    ];
    component.subTopicFilterDict = {
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: true,
        },
      ],
    };

    component.updateSkillsListOnSubtopicFilterChange();

    expect(component.currCategorizedSkills).toEqual({
      topic1: {
        uncategorized: [],
        subtopic1: [ShortSkillSummary.create('skill2', 'Skill 2 description.')],
      },
    });
  });

  it('should search in untriaged skill summaries and not return excluded skills', () => {
    component.untriagedSkillSummaries = [
      SkillSummary.createFromBackendDict({
        id: '1',
        description: 'This is untriaged skill summary 1',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'This is untriaged skill summary 2',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
      SkillSummary.createFromBackendDict({
        id: '3',
        description: 'This is untriaged skill summary 3',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
    ];
    component.skillIdsToExclude = new Set(['1', '2']);

    expect(component.searchInUntriagedSkillSummaries('')).toEqual([
      SkillSummary.createFromBackendDict({
        id: '3',
        description: 'This is untriaged skill summary 3',
        language_code: '',
        version: 1,
        misconception_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444,
      }),
    ]);
  });

  it('should update augmentedTopicFilterList and augmentedSubTopicFilterDict via refreshFilterLists', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Algebra equation.'),
        ],
        subtopic1: [ShortSkillSummary.create('skill2', 'Geometry shapes.')],
      },
    };
    component.ngOnInit();

    // Exercise refreshFilterLists without a spy so the assignment paths
    // in the component are actually covered.
    component.skillFilterText = 'Algebra';

    expect(component.augmentedTopicFilterList.length).toBe(1);
    expect(component.augmentedTopicFilterList[0].topicName).toBe('topic1');
    expect(component.augmentedSubTopicFilterDict.topic1.length).toBe(1);
    expect(component.augmentedSubTopicFilterDict.topic1[0].subTopicName).toBe(
      'uncategorized'
    );
  });
});
