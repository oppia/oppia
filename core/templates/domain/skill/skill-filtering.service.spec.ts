// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillFilteringService.
 */

import {TestBed} from '@angular/core/testing';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {FilterForMatchingSubstringPipe} from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import {SkillFilteringService} from 'domain/skill/skill-filtering.service';
import {CategorizedSkills} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

describe('SkillFilteringService', () => {
  let service: SkillFilteringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SkillFilteringService, FilterForMatchingSubstringPipe],
    });
    service = TestBed.inject(SkillFilteringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if skill list is empty', () => {
    expect(service.checkIfEmpty([])).toBe(true);
    expect(service.checkIfEmpty(['skill'])).toBe(false);
  });

  it('should check if topic is empty', () => {
    const categorizedSkills = {
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

    expect(service.checkTopicIsNotEmpty('topic1', categorizedSkills)).toBe(
      true
    );
    expect(service.checkTopicIsNotEmpty('topic2', categorizedSkills)).toBe(
      false
    );
  });

  it('should search in subtopic skills and return filtered skills', () => {
    const inputShortSkillSummaries: ShortSkillSummary[] = [
      ShortSkillSummary.create('skill1', 'Skill 1 description.'),
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.'),
    ];
    const searchText = 'skill 2';

    expect(
      service.searchInSubtopicSkills(inputShortSkillSummaries, searchText)
    ).toEqual([
      ShortSkillSummary.create('skill2', 'Skill 2 description.'),
      ShortSkillSummary.create('skill3', 'Skill 2 and 3 description.'),
    ]);
  });

  it('should search in untriaged skill summaries', () => {
    const untriagedSkills = [
      SkillSummary.createFromBackendDict({
        id: '1',
        description: 'Algebra 1',
        language_code: 'en',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 0,
        skill_model_last_updated: 0,
      }),
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'Algebra 2',
        language_code: 'en',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 0,
        skill_model_last_updated: 0,
      }),
    ];
    const excludeIds = new Set(['1']);

    // Should find Algebra 2 (since Algebra 1 is excluded).
    const result = service.searchInUntriagedSkillSummaries(
      untriagedSkills,
      excludeIds,
      'Algebra'
    );
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });

  it('should update skill list based on subtopic filter', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [],
        subtopic1: [ShortSkillSummary.create('s1', 'd1')],
        subtopic2: [ShortSkillSummary.create('s2', 'd2')],
      },
    };
    const subTopicFilterDict = {
      topic1: [
        {subTopicName: 'subtopic1', checked: true},
        {subTopicName: 'subtopic2', checked: false},
      ],
    };
    const topicFilterList = [{topicName: 'topic1', checked: true}];

    const result = service.updateSkillsListOnSubtopicFilterChange(
      categorizedSkills,
      subTopicFilterDict,
      topicFilterList
    );

    expect(result.topic1.subtopic1.length).toBe(1);
    expect(result.topic1.subtopic2).toBeUndefined();
  });

  it('should return original skills if no subtopics checked but topic is checked', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [],
        subtopic1: [ShortSkillSummary.create('s1', 'd1')],
      },
    };
    const subTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: false}],
    };
    const topicFilterList = [{topicName: 'topic1', checked: true}];

    const result = service.updateSkillsListOnSubtopicFilterChange(
      categorizedSkills,
      subTopicFilterDict,
      topicFilterList
    );

    // Should return everything for topic1 since no specific subtopic is selected.
    expect(result.topic1.subtopic1.length).toBe(1);
  });

  it('should update subtopic filter dict when topic filter changes', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [],
        subtopic1: [ShortSkillSummary.create('s1', 'd1')],
      },
    };
    const initialSubTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: false}],
    };
    const subTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: true}],
    };
    const topicFilterList = [{topicName: 'topic1', checked: true}];

    // This simulates re-checking the topic, which should reset subtopics to initial state.
    const result = service.updateSkillsListOnTopicFilterChange(
      categorizedSkills,
      initialSubTopicFilterDict,
      subTopicFilterDict,
      topicFilterList
    );

    // Should reset to unchecked (from initialSubTopicFilterDict).
    expect(result.subTopicFilterDict.topic1[0].checked).toBe(false);
  });

  it('should update skill list when user filters skills by only topics', () => {
    const categorizedSkills = {
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

    const initialSubTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: false}],
      topic2: [{subTopicName: 'uncategorized', checked: false}],
    };

    const subTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: false}],
      topic2: [{subTopicName: 'uncategorized', checked: false}],
    };

    const topicFilterList = [
      {topicName: 'topic1', checked: true},
      {topicName: 'topic2', checked: false},
    ];

    const result = service.updateSkillsListOnTopicFilterChange(
      categorizedSkills,
      initialSubTopicFilterDict,
      subTopicFilterDict,
      topicFilterList
    );

    // Should only contain topic1 skills.
    expect(Object.keys(result.currCategorizedSkills).length).toBe(1);
    expect(result.currCategorizedSkills.topic1).toBeDefined();
    expect(result.currCategorizedSkills.topic2).toBeUndefined();
  });

  it('should compute augmented topic list for search text', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'Algebra equation')],
        subtopic1: [],
      },
      topic2: {
        uncategorized: [ShortSkillSummary.create('s2', 'Geometry shapes')],
        subtopic1: [],
      },
    };
    const topicFilterList = [
      {topicName: 'topic1', checked: false},
      {topicName: 'topic2', checked: false},
    ];
    const subTopicFilterDict = {
      topic1: [
        {subTopicName: 'uncategorized', checked: false},
        {subTopicName: 'subtopic1', checked: false},
      ],
      topic2: [
        {subTopicName: 'uncategorized', checked: false},
        {subTopicName: 'subtopic1', checked: false},
      ],
    };

    const result = service.computeAugmentedTopicFilterList(
      topicFilterList,
      subTopicFilterDict,
      categorizedSkills,
      'Algebra'
    );

    // Should only return topic1 because it matches "Algebra".
    expect(result.augmentedTopicFilterList.length).toBe(1);
    expect(result.augmentedTopicFilterList[0].topicName).toBe('topic1');
  });

  it('should return all topics if search text is empty', () => {
    const topicFilterList = [{topicName: 'topic1', checked: false}];
    const result = service.computeAugmentedTopicFilterList(
      topicFilterList,
      {},
      {},
      ''
    );
    expect(result.augmentedTopicFilterList.length).toBe(1);
  });

  // Coverage: checkTopicHasMatchingSkills — no search text returns true.
  it('should return true for all topics when no search text is provided', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'Anything')],
      },
    };
    expect(
      service.checkTopicHasMatchingSkills('topic1', categorizedSkills, '')
    ).toBe(true);
  });

  // Coverage: checkTopicHasMatchingSkills — undefined categorizedSkills.
  it('should return false from checkTopicHasMatchingSkills if categorizedSkills is undefined', () => {
    expect(
      service.checkTopicHasMatchingSkills(
        'topic1',
        undefined as unknown as CategorizedSkills,
        'abc'
      )
    ).toBe(false);
  });

  // Coverage: checkTopicHasMatchingSkills — no matching skills returns false.
  it('should return false when topic has no matching skills', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'Algebra equations.')],
      },
    };
    expect(
      service.checkTopicHasMatchingSkills(
        'topic1',
        categorizedSkills,
        'Physics'
      )
    ).toBe(false);
  });

  // Coverage: checkSubtopicHasMatchingSkills — no search text returns true.
  it('should return true for all subtopics when no search text is provided', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [],
        subtopic1: [ShortSkillSummary.create('s1', 'Anything')],
      },
    };
    expect(
      service.checkSubtopicHasMatchingSkills(
        'topic1',
        'subtopic1',
        categorizedSkills,
        ''
      )
    ).toBe(true);
  });

  // Coverage: checkSubtopicHasMatchingSkills — undefined categorizedSkills.
  it('should return false from checkSubtopicHasMatchingSkills if categorizedSkills is undefined', () => {
    expect(
      service.checkSubtopicHasMatchingSkills(
        'topic1',
        'subtopic1',
        undefined as unknown as CategorizedSkills,
        'abc'
      )
    ).toBe(false);
  });

  // Coverage: checkSubtopicHasMatchingSkills — no matching skills returns false.
  it('should return false when subtopic has no matching skills', () => {
    const categorizedSkills = {
      topic1: {
        subtopic1: [ShortSkillSummary.create('s1', 'Algebra equations.')],
        uncategorized: [],
      },
    };
    expect(
      service.checkSubtopicHasMatchingSkills(
        'topic1',
        'subtopic1',
        categorizedSkills,
        'Physics'
      )
    ).toBe(false);
  });

  // Coverage: updateSkillsListOnSubtopicFilterChange — no filters at all
  // returns the original categorizedSkills.
  it('should return all skills when no topic or subtopic filter is checked', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'd1')],
        subtopic1: [ShortSkillSummary.create('s2', 'd2')],
      },
    };
    const subTopicFilterDict = {
      topic1: [{subTopicName: 'subtopic1', checked: false}],
    };
    const topicFilterList = [{topicName: 'topic1', checked: false}];

    const result = service.updateSkillsListOnSubtopicFilterChange(
      categorizedSkills,
      subTopicFilterDict,
      topicFilterList
    );

    // No filters → returns the original list.
    expect(result.topic1.subtopic1.length).toBe(1);
    expect(result.topic1.uncategorized.length).toBe(1);
  });

  // Coverage: computeAugmentedTopicFilterList — else if branch where
  // subTopicFilterDict[topicName] is missing but checkTopicHasMatchingSkills
  // returns true.
  it('should add topic to augmented list when subtopic dict is missing but topic has matching skills', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'Algebra equation')],
      },
    };
    const topicFilterList = [{topicName: 'topic1', checked: false}];
    // SubTopicFilterDict has no entry for topic1.
    const subTopicFilterDict = {};

    const result = service.computeAugmentedTopicFilterList(
      topicFilterList,
      subTopicFilterDict,
      categorizedSkills,
      'Algebra'
    );

    expect(result.augmentedTopicFilterList.length).toBe(1);
    expect(result.augmentedTopicFilterList[0].topicName).toBe('topic1');
    // No subtopic entries since dict was missing.
    expect(result.augmentedSubTopicFilterDict.topic1).toBeUndefined();
  });

  // Coverage: searchInUntriagedSkillSummaries — empty search text with
  // exclusions should return all non-excluded summaries.
  it('should return all non-excluded untriaged summaries when search text is empty', () => {
    const untriagedSkills = [
      SkillSummary.createFromBackendDict({
        id: '1',
        description: 'Summary 1',
        language_code: 'en',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 0,
        skill_model_last_updated: 0,
      }),
      SkillSummary.createFromBackendDict({
        id: '2',
        description: 'Summary 2',
        language_code: 'en',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 0,
        skill_model_last_updated: 0,
      }),
      SkillSummary.createFromBackendDict({
        id: '3',
        description: 'Summary 3',
        language_code: 'en',
        version: 1,
        misconception_count: 0,
        skill_model_created_on: 0,
        skill_model_last_updated: 0,
      }),
    ];
    const excludeIds = new Set(['1', '2']);

    const result = service.searchInUntriagedSkillSummaries(
      untriagedSkills,
      excludeIds,
      ''
    );

    // Only id '3' should remain (1 and 2 are excluded).
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('3');
  });

  // Coverage: computeAugmentedTopicFilterList — subtopics exist in dict
  // but none match, and topic should NOT be added.
  it('should not add topic to augmented list when no subtopics match search text', () => {
    const categorizedSkills = {
      topic1: {
        uncategorized: [ShortSkillSummary.create('s1', 'Physics motion')],
      },
    };
    const topicFilterList = [{topicName: 'topic1', checked: false}];
    const subTopicFilterDict = {
      topic1: [{subTopicName: 'uncategorized', checked: false}],
    };

    const result = service.computeAugmentedTopicFilterList(
      topicFilterList,
      subTopicFilterDict,
      categorizedSkills,
      'Algebra'
    );

    expect(result.augmentedTopicFilterList.length).toBe(0);
    expect(Object.keys(result.augmentedSubTopicFilterDict).length).toBe(0);
  });
});
