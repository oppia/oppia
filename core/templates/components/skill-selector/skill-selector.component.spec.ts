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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillSummary } from 'domain/skill/skill-summary.model';
import { UserService } from 'services/user.service';
import { SkillSelectorComponent } from './skill-selector.component';


/**
 * @fileoverview Unit tests for SkillSelectorComponent.
 */

describe('SkillSelectorComponent', () => {
  let component: SkillSelectorComponent;
  let fixture: ComponentFixture<SkillSelectorComponent>;
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        SkillSelectorComponent
      ],
      providers: [
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillSelectorComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  beforeEach(() => {
    spyOn(
      userService, 'canUserAccessTopicsAndSkillsDashboard'
    ).and.returnValue(Promise.resolve(true));
  });

  it('should initialize topic and subtopic filters to unchecked state', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      }
    };

    expect(component.topicFilterList).toEqual([]);
    expect(component.subTopicFilterDict).toEqual({});

    component.ngOnInit();

    // Expecting all topics and subtopics to be unchecked after initialization.
    expect(component.topicFilterList).toEqual([
      {
        topicName: 'topic1',
        checked: false
      }
    ]);
    expect(component.subTopicFilterDict).toEqual({
      topic1: [
        {
          subTopicName: 'uncategorized',
          checked: false
        },
        {
          subTopicName: 'subtopic1',
          checked: false
        },
        {
          subTopicName: 'subtopic2',
          checked: false
        }
      ]
    });
  });

  it('should check if skill is empty', () => {
    let categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: []
      }
    };

    expect(component.checkIfEmpty(
      categorizedSkills.topic1.subtopic1)).toBe(false);
    expect(component.checkIfEmpty(
      categorizedSkills.topic1.subtopic2)).toBe(true);
  });

  it('should check if topic is empty', () => {
    // An empty topic must have an empty 'uncategorized' subtopic.
    component.currCategorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ]
      },
      topic2: {
        uncategorized: []
      }
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

  it('should display subtopics from all topics in the subtopic filter if' +
    ' no topic is checked', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ]
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.')
        ]
      }
    };

    component.ngOnInit();

    component.subTopicFilterDict = {};

    component.updateSkillsListOnTopicFilterChange();

    // All subtopics from all topics is included in the subtopic filter dict.
    expect((component.subTopicFilterDict)).toEqual({
      topic1: [
        {
          subTopicName: 'uncategorized',
          checked: false
        },
        {
          subTopicName: 'subtopic1',
          checked: false
        }
      ],
      topic2: [
        {
          subTopicName: 'uncategorized',
          checked: false
        }
      ]
    });
  });

  it('should update skill list when user filters skills by only topics', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.')
        ],
        subtopic3: [
          ShortSkillSummary.create('skill5', 'Skill 5 description.')
        ],
        subtopic4: [
          ShortSkillSummary.create('skill6', 'Skill 6 description.')
        ]
      }
    };
    component.ngOnInit();

    // User checks the 'topic1' radio button.
    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true
      },
      {
        topicName: 'topic2',
        checked: false
      }
    ];

    expect(component.currCategorizedSkills).toEqual({
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.')
        ],
        subtopic3: [
          ShortSkillSummary.create('skill5', 'Skill 5 description.')
        ],
        subtopic4: [
          ShortSkillSummary.create('skill6', 'Skill 6 description.')
        ]
      }
    });

    component.updateSkillsListOnTopicFilterChange();

    expect(component.currCategorizedSkills).toEqual({
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      }
    });
  });

  it('should update skill list when user filters skills by' +
    ' topics and subtopics', () => {
    component.categorizedSkills = {
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.')
        ],
        subtopic3: [
          ShortSkillSummary.create('skill5', 'Skill 5 description.')
        ],
        subtopic4: [
          ShortSkillSummary.create('skill6', 'Skill 6 description.')
        ]
      }
    };

    component.ngOnInit();

    // User checks 'topic1' radio button and 'subtopic1' radio button.
    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true
      }
    ];
    component.subTopicFilterDict = {
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: true
        }
      ]
    };

    expect(component.currCategorizedSkills).toEqual({
      topic1: {
        uncategorized: [
          ShortSkillSummary.create('skill1', 'Skill 1 description.')
        ],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ],
        subtopic2: [
          ShortSkillSummary.create('skill3', 'Skill 3 description.')
        ]
      },
      topic2: {
        uncategorized: [
          ShortSkillSummary.create('skill4', 'Skill 4 description.')
        ],
        subtopic3: [
          ShortSkillSummary.create('skill5', 'Skill 5 description.')
        ],
        subtopic4: [
          ShortSkillSummary.create('skill6', 'Skill 6 description.')
        ]
      }
    });

    component.updateSkillsListOnSubtopicFilterChange();

    expect((component.currCategorizedSkills)).toEqual({
      topic1: {
        uncategorized: [],
        subtopic1: [
          ShortSkillSummary.create('skill2', 'Skill 2 description.')
        ]
      }
    });
  });

  it('should clear all filters when user clicks on \'Clear All' +
    ' Filters\'', () => {
    component.topicFilterList = [
      {
        topicName: 'topic1',
        checked: true
      }
    ];
    component.subTopicFilterDict = {
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: true
        }
      ]
    };

    component.clearAllFilters();

    expect(component.topicFilterList).toEqual([
      {
        topicName: 'topic1',
        checked: false
      }
    ]);
    expect(component.subTopicFilterDict).toEqual({
      topic1: [
        {
          subTopicName: 'subtopic1',
          checked: false
        }
      ]
    });
  });

  it('should search in subtopic skills and return filtered skills', () => {
    let inputShortSkillSummaries: ShortSkillSummary[] = [
      ShortSkillSummary.create('skill1', 'Skill 1 description.'),
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.')
    ];
    let searchText = 'skill 2';

    expect(component.searchInSubtopicSkills(
      inputShortSkillSummaries, searchText)).toEqual([
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.')
    ]);
  });

  it('should search in untriaged skill summaries and return' +
    ' filtered skills', () => {
    component.untriagedSkillSummaries = [
      SkillSummary.createFromBackendDict({
        id: '1',
        description: 'This is untriaged skill summary 1',
        language_code: '',
        version: 1,
        misconception_count: 2,
        worked_examples_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444
      }),
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'This is untriaged skill summary 2',
        language_code: '',
        version: 1,
        misconception_count: 2,
        worked_examples_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444
      })
    ];

    expect(component.searchInUntriagedSkillSummaries(
      'skill summary 2')).toEqual([
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'This is untriaged skill summary 2',
        language_code: '',
        version: 1,
        misconception_count: 2,
        worked_examples_count: 2,
        skill_model_created_on: 121212,
        skill_model_last_updated: 124444
      })
    ]);
  });
});
