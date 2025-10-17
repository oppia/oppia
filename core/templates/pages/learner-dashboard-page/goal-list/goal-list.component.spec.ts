// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for GoalListComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {GoalListComponent} from './goal-list.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {StoryNode} from 'domain/story/story-node.model';

describe('GoalListComponent', () => {
  let component: GoalListComponent;
  let fixture: ComponentFixture<GoalListComponent>;
  let assetsBackendApiService: AssetsBackendApiService;

  let subtopic = {
    skill_ids: ['skill_id_2'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };

  let sampleStoryNode = {
    id: 'node_1',
    thumbnail_filename: 'image.png',
    title: 'Title 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: 'exp_id_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null,
  };

  let sampleStoryNode2 = {
    id: 'node_2',
    thumbnail_filename: 'image.png',
    title: 'Title 2',
    description: 'Description 2',
    prerequisite_skill_ids: ['skill_2'],
    acquired_skill_ids: ['skill_3'],
    destination_node_ids: ['node_3'],
    outline: 'Outline',
    exploration_id: 'exp_id_2',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null,
  };

  let sampleStoryNode3 = {
    id: 'node_3',
    thumbnail_filename: 'image.png',
    title: 'Title 3',
    description: 'Description 2',
    prerequisite_skill_ids: ['skill_3'],
    acquired_skill_ids: ['skill_4'],
    destination_node_ids: ['node_4'],
    outline: 'Outline',
    exploration_id: 'exp_id_3',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null,
  };

  let sampleStorySummary = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2', 'Title 3'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Title 1', 'Title 2', 'Title 3'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleStoryNode, sampleStoryNode2, sampleStoryNode3],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  let newStorySummary = {
    id: '1',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story-title',
    all_node_dicts: [sampleStoryNode, sampleStoryNode2],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  let incompleteStorySummary = {
    id: '2',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2', 'Title 3'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Title 1', 'Title 2'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleStoryNode, sampleStoryNode2, sampleStoryNode3],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  let sampleLearnerTopicSummaryBackendDict = {
    id: 'sample_topic_id',
    name: 'Topic Name',
    language_code: 'en',
    description: 'description',
    version: 1,
    story_titles: ['Story 1'],
    total_published_node_count: 3,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    classroom_name: 'math',
    classroom_url_fragment: 'math',
    practice_tab_is_displayed: false,
    canonical_story_summary_dict: [
      sampleStorySummary,
      newStorySummary,
      incompleteStorySummary,
    ],
    url_fragment: 'topic-name',
    subtopics: [subtopic],
    degrees_of_mastery: {
      skill_id_1: 0.5,
      skill_id_2: 0.3,
    },
    skill_descriptions: {
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2',
    },
  };

  class MockPlatformFeatureService {
    status = {
      SerialChapterLaunchLearnerView: {
        isEnabled: false,
      },
    };
  }
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [
        {provide: PlatformFeatureService, useValue: mockPlatformFeatureService},
        AssetsBackendApiService,
      ],
      declarations: [GoalListComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalListComponent);
    component = fixture.componentInstance;
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    component.goalTopic = LearnerTopicSummary.createFromBackendDict(
      sampleLearnerTopicSummaryBackendDict
    );
  });

  it('should set imgUrl correctly', () => {
    const assetBackendSpy = spyOn(
      assetsBackendApiService,
      'getThumbnailUrlForPreview'
    ).and.returnValue(
      '/assetsdevhandler/topic/sample_topic_id/assets/thumbnail/image.svg'
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(assetBackendSpy).toHaveBeenCalledWith(
      'topic',
      'sample_topic_id',
      'image.svg'
    );
    expect(component.imgUrl).toEqual(
      '/assetsdevhandler/topic/sample_topic_id/assets/thumbnail/image.svg'
    );
  });

  it('should get story progress correctly', () => {
    const story = StorySummary.createFromBackendDict(sampleStorySummary);

    const progress = component.getStoryProgress(story);
    expect(progress).toEqual(100);
  });

  it('should return the correct lesson url with getNodeLessonUrl', () => {
    const story = StorySummary.createFromBackendDict(sampleStorySummary);
    const node = StoryNode.createFromBackendDict(sampleStoryNode);
    const progress = component.getNodeLessonUrl(story, node);

    expect(progress).toEqual(
      '/explore/exp_id_1?topic_url_fragment=topic&classroom_url_fragment=math&story_url_fragment=story-title&node_id=node_1'
    );
  });

  it('should throw an error for undefined topic_url_fragment with getNodeLessonUrl', () => {
    let undefinedStorySummary = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Title 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 1'],
      url_fragment: 'story-title',
      all_node_dicts: [sampleStoryNode],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: undefined,
    };

    expect(() => {
      const undefinedStory = StorySummary.createFromBackendDict(
        undefinedStorySummary
      );
      const node = StoryNode.createFromBackendDict(sampleStoryNode);
      component.getNodeLessonUrl(undefinedStory, node);
    }).toThrowError('Class and/or topic does not exist');
  });

  it('should return the correct current node for multiple canonical story summaries', () => {
    const getMostRecentCompletedNodeSpy = spyOn(
      component,
      'getMostRecentCompletedNode'
    ).and.callThrough();

    fixture.detectChanges();

    expect(getMostRecentCompletedNodeSpy).toHaveBeenCalledTimes(3);
    expect(component.allCurrentNodes).toEqual([3, 0, 2]);
  });

  it('should return the first node as the earliest if the only completed node is the last and there are remaining nodes', () => {
    let lastStorySummary = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Title 1', 'Title 2', 'Title 3'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 2', 'Title 3'],
      url_fragment: 'story-title',
      all_node_dicts: [sampleStoryNode, sampleStoryNode2, sampleStoryNode3],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    const currentNode = component.getMostRecentCompletedNode(
      StorySummary.createFromBackendDict(lastStorySummary)
    );

    expect(currentNode).toEqual(0);
  });

  it('should return the earliest node of multiple nodes completed out of order', () => {
    let unorderedStorySummary = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Title 1', 'Title 2', 'Title 3'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 1', 'Title 3'],
      url_fragment: 'story-title',
      all_node_dicts: [sampleStoryNode, sampleStoryNode2, sampleStoryNode3],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    const currentNode = component.getMostRecentCompletedNode(
      StorySummary.createFromBackendDict(unorderedStorySummary)
    );

    expect(currentNode).toEqual(1);
  });

  it('should return the most recent node of multiple nodes', () => {
    let noOrderStorySummary = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Title 1', 'Title 2', 'Title 3'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 2'],
      url_fragment: 'story-title',
      all_node_dicts: [sampleStoryNode, sampleStoryNode2, sampleStoryNode3],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    const currentNode = component.getMostRecentCompletedNode(
      StorySummary.createFromBackendDict(noOrderStorySummary)
    );

    expect(currentNode).toEqual(2);
  });

  describe('expandedStories', () => {
    it('should return false if story is not in expandedStories', () => {
      const storyId = 'story_1';
      expect(component.isExpanded(storyId)).toBeFalse();
    });

    it('should return true after toggling a story once', () => {
      const storyId = 'story_2';
      component.handleToggleState(true, storyId);
      expect(component.isExpanded(storyId)).toBeTrue();
    });

    it('should return false after toggling a story twice', () => {
      const storyId = 'story_3';
      component.handleToggleState(true, storyId);
      component.handleToggleState(false, storyId);
      expect(component.isExpanded(storyId)).toBeFalse();
    });

    it('should keep expanded state independent for different stories', () => {
      const storyA = 'story_A';
      const storyB = 'story_B';

      component.handleToggleState(true, storyA);
      expect(component.isExpanded(storyA)).toBeTrue();
      expect(component.isExpanded(storyB)).toBeFalse();

      component.handleToggleState(true, storyB);
      expect(component.isExpanded(storyA)).toBeTrue();
      expect(component.isExpanded(storyB)).toBeTrue();
    });

    it('should return false for story explicitly set to false', () => {
      const storyId = 'story_4';
      component.expandedStories[storyId] = false;
      expect(component.isExpanded(storyId)).toBeFalse();
    });

    it('should return true for story explicitly set to true', () => {
      const storyId = 'story_5';
      component.expandedStories[storyId] = true;
      expect(component.isExpanded(storyId)).toBeTrue();
    });
  });

  describe('getStartButtonClass', () => {
    let storySummary: StorySummary;
    let storyNode: StoryNode;

    beforeEach(() => {
      component.allCurrentNodes = [0, 1, 0];
      storySummary = component.goalTopic.getCanonicalStorySummaryDicts()[0];
      storyNode = storySummary.getAllNodes()[0] as StoryNode;
    });

    it('should (getStartButtonClass) return default if serial feature disabled', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(false);
      expect(component.getStartButtonClass(storySummary, 0)).toBe(
        'oppia-learner-dash-button--default'
      );
    });

    it('should (getStartButtonClass) return disabled if node unpublished', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(false);

      expect(component.getStartButtonClass(storySummary, 0)).toBe(
        'oppia-learner-dash-button--disabled'
      );
    });

    it('should (getStartButtonClass) return default if story is not expanded', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(false);

      const className = component.getStartButtonClass(storySummary, 0);
      expect(className).toBe('oppia-learner-dash-button--default');
    });

    it('should (getStartButtonClass) return inverse-incomplete if story expanded but node not current', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      const nodes = storySummary.getAllNodes();
      spyOn(nodes[1], 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(true);
      component.allCurrentNodes = [0, 1, 0];

      const className = component.getStartButtonClass(storySummary, 1);
      expect(className).toBe(
        'oppia-learner-dash-button--inverse oppia-learner-dash-button--incomplete-goal'
      );
    });

    it('should (getStartButtonClass) return default if story expanded and node is current', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(true);
      component.allCurrentNodes = [0, 1, 0];

      const className = component.getStartButtonClass(storySummary, 0);
      expect(className).toBe('oppia-learner-dash-button--default');
    });

    it('should (getStartButtonClass) return default when story expanded and checking the exact current playable node', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      const nodes = storySummary.getAllNodes();
      spyOn(nodes[1], 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(true);
      component.allCurrentNodes = [1, 1, 0];

      const className = component.getStartButtonClass(storySummary, 1);
      expect(className).toBe('oppia-learner-dash-button--default');
    });
  });

  describe('getStartButtonHref', () => {
    let storySummary: StorySummary;
    let storyNode: StoryNode;

    beforeEach(() => {
      component.allCurrentNodes = [0, 1, 0];
      storySummary = component.goalTopic.getCanonicalStorySummaryDicts()[0];
      storyNode = storySummary.getAllNodes()[0] as StoryNode;
    });

    it('should (getStartButtonHref) return lesson url if serial feature disabled', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(false);
      spyOn(component, 'getNodeLessonUrl').and.returnValue('/lesson/exp_1');

      expect(component.getStartButtonHref(storySummary, 0)).toBe(
        '/lesson/exp_1'
      );
    });

    it('should (getStartButtonHref) return null if node unpublished', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(false);

      expect(component.getStartButtonHref(storySummary, 0)).toBeNull();
    });

    it('should (getStartButtonHref) return lesson URL if story is expanded', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(true);
      spyOn(component, 'getNodeLessonUrl').and.returnValue('/lesson/exp_1');

      const href = component.getStartButtonHref(storySummary, 0);
      expect(href).toBe('/lesson/exp_1');
    });

    it('should (getStartButtonHref) return null if story not expanded and checking non-current node', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      const nodes = storySummary.getAllNodes();
      spyOn(nodes[1], 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(false);
      component.allCurrentNodes = [0, 1, 0];

      const href = component.getStartButtonHref(storySummary, 1);
      expect(href).toBeNull();
    });

    it('should (getStartButtonHref) return lesson URL if story not expanded but checking current node', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(false);
      spyOn(component, 'getNodeLessonUrl').and.returnValue('/lesson/exp_1');
      component.allCurrentNodes = [0, 1, 0];

      const href = component.getStartButtonHref(storySummary, 0);
      expect(href).toBe('/lesson/exp_1');
    });

    it('should (getStartButtonHref) return lesson URL when story expanded and node matches current playable node', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      const nodes = storySummary.getAllNodes();
      spyOn(nodes[1], 'getPublishedStatus').and.returnValue(true);
      spyOn(component, 'isExpanded').and.returnValue(true);
      spyOn(component, 'getNodeLessonUrl').and.returnValue('/lesson/exp_2');
      component.allCurrentNodes = [1, 1, 0];

      const href = component.getStartButtonHref(storySummary, 1);
      expect(href).toBe('/lesson/exp_2');
    });
  });

  describe('getStartButtonLabel', () => {
    let storySummary: StorySummary;
    let storyNode: StoryNode;

    beforeEach(() => {
      component.allCurrentNodes = [0, 1, 0];
      storySummary = component.goalTopic.getCanonicalStorySummaryDicts()[0];
      storyNode = storySummary.getAllNodes()[0] as StoryNode;
    });

    it('should (getStartButtonLabel) return start label if serial feature disabled', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(false);

      expect(component.getStartButtonLabel(storySummary, 0)).toBe(
        'I18N_LEARNER_DASHBOARD_CARD_BUTTON_START'
      );
    });

    it('should (getStartButtonLabel) return coming soon if node unpublished', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(false);

      expect(component.getStartButtonLabel(storySummary, 0)).toBe(
        'I18N_LEARNER_STORY_TILE_COMING_SOON'
      );
    });

    it('should (getStartButtonLabel) return start if node published', () => {
      spyOn(
        component,
        'isSerialChapterFeatureLearnerFlagEnabled'
      ).and.returnValue(true);
      spyOn(storyNode, 'getPublishedStatus').and.returnValue(true);

      expect(component.getStartButtonLabel(storySummary, 0)).toBe(
        'I18N_LEARNER_DASHBOARD_CARD_BUTTON_START'
      );
    });
  });
});
