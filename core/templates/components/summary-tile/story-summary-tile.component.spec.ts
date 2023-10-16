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
 * @fileoverview Unit tests for StorySummaryTileComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StorySummary } from 'domain/story/story-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { StorySummaryTileComponent } from './story-summary-tile.component';
import { PlatformFeatureService } from '../../services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false
    }
  };
}

describe('StorySummaryTileComponent', () => {
  let component: StorySummaryTileComponent;
  let fixture: ComponentFixture<StorySummaryTileComponent>;
  let wds: WindowDimensionsService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StorySummaryTileComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StorySummaryTileComponent);
    component = fixture.componentInstance;
    wds = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(false);

    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(true);
  });

  it('should set properties on initialization', () => {
    // Here, storySummary contains a StorySummary object, which defines the
    // properties of a story and its nodes.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'math_thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: [
        {
          id: 'node_1',
          title: 'node1',
          description: 'This is node 1',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: 'exp-1',
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_2',
          title: 'node2',
          description: 'This is node 2',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: 'exp-2',
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_3',
          title: 'node3',
          description: 'This is node 3',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: 'exp-3',
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Ready To Publish',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }
      ]
    });

    spyOn(i18nLanguageCodeService, 'getStoryTranslationKey')
      .and.returnValue('I18N_STORY_storyId_TITLE');
    spyOn(i18nLanguageCodeService, 'getExplorationTranslationKey')
      .and.returnValue('I18N_EXPLORATION_explId_TITLE');
    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValues(false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValues(false, false);

    component.ngOnInit();

    expect(component.nodeCount).toBe(3);
    expect(component.completedStoriesCount).toBe(1);
    expect(component.storyProgress).toBe(50);
    expect(component.storyLink).toBe('#');
    expect(component.storyTitle).toBe('Story Title');
    expect(component.storyTitleTranslationKey).toEqual(
      'I18N_STORY_storyId_TITLE');
    expect(component.nodeTitlesTranslationKeys).toEqual(
      [
        'I18N_EXPLORATION_explId_TITLE',
        'I18N_EXPLORATION_explId_TITLE',
        'I18N_EXPLORATION_explId_TITLE'
      ]);
    // Translation is only displayed if the language is not English
    // and it's hacky translation is available.
    let hackyStoryTitleTranslationIsDisplayed =
      component.isHackyStoryTitleTranslationDisplayed();
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    let hackyNodeTitleTranslationIsDisplayed =
      component.isHackyNodeTitleTranslationDisplayed(0);
    expect(hackyNodeTitleTranslationIsDisplayed).toBe(true);
    // Here the value is calculated by the formula -> (circumference -
    // (availableNodeCount * gapLength))/availableNodeCount =
    // (2 * 20 * Math.PI - (2*5)) / 2 = 57.83185307179586. Along with this
    // value, gapLength (5) is also concatenated to the string.
    expect(component.strokeDashArrayValues).toBe('57.83185307179586 5');

    // Here the value for completed node is calculated with the same formula,
    // and the last node's value is the difference of (2 * 20 * Math.PI) and the
    // first value.
    expect(component.completedStrokeDashArrayValues).toBe(
      '57.83185307179586 67.83185307179586');
    expect(component.thumbnailBgColor).toBe('#FF9933');
    expect(component.nodeTitles).toEqual(['node1', 'node2', 'node3']);
    expect(component.availableNodeCount).toBe(2);
    expect(component.comingSoonNodeCount).toBe(1);
  });

  it('should not show thumbnail if thumbnail filename is not given', () => {
    // StorySummary without a thumbnail.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: '',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    expect(component.thumbnailUrl).toBe(null);

    component.ngOnInit();

    expect(component.thumbnailUrl).toBe(null);
  });

  it('should show thumbnail if thumbnail filename is given', () => {
    // StorySummary with a thumbnail.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    expect(component.thumbnailUrl).toBe(null);

    component.ngOnInit();

    expect(component.thumbnailUrl)
      .toBe('/assetsdevhandler/story/storyId/assets/thumbnail/thumbnail.jpg');
  });

  it('should display only 1 chapters if window width is less' +
    ' than equal to 500px', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });
    spyOn(wds, 'getWidth').and.returnValue(460);

    expect(component.chaptersDisplayed).toBe(undefined);

    component.ngOnInit();

    expect(component.chaptersDisplayed).toBe(1);
  });

  it('should display only 2 chapters if window width is greater' +
    ' than 500px and less than 768px', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });
    spyOn(wds, 'getWidth').and.returnValue(650);

    expect(component.chaptersDisplayed).toBe(undefined);

    component.ngOnInit();

    expect(component.chaptersDisplayed).toBe(2);
  });

  it('should display 3 chapters if window width is greater' +
  ' than 768px', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });
    spyOn(wds, 'getWidth').and.returnValue(800);

    expect(component.chaptersDisplayed).toBe(undefined);

    component.ngOnInit();

    expect(component.chaptersDisplayed).toBe(3);
  });

  it('should return correct story status', () => {
    component.storyProgress = 0;
    component.getStoryStatus();
    expect(component.storyStatus).toBe('Not Started');
    component.storyProgress = 67;
    component.getStoryStatus();
    expect(component.storyStatus).toBe('In Progress');
    component.storyProgress = 100;
    component.getStoryStatus();
    expect(component.storyStatus).toBe('Completed');
  });

  it('should check if the view is tablet or not', () => {
    var widthSpy = spyOn(wds, 'getWidth');
    widthSpy.and.returnValue(700);
    expect(component.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);
    expect(component.checkTabletView()).toBe(false);
  });

  it('should show \'View All\' button if number of nodes is not same as the' +
    ' number of chapters displayed', () => {
    // StorySummary with 3 nodes.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    // We return width equal to 801 (greater than 800), so that 3 chapters are
    // displayed instead of 2.
    spyOn(wds, 'getWidth').and.returnValue(801);

    expect(component.showButton).toBe(false);

    component.ngOnInit();

    expect(component.showButton).toBe(false);

    // StorySummary with 5 nodes.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3', 'node4', 'node5'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    component.ngOnInit();

    // Will show 'View All' button as number of nodes (5) is more than chapters
    // displayed (3).
    expect(component.showButton).toBe(true);
  });

  it('should show the number of completed chapters through' +
    ' progress circle', () => {
    // StorySummary with 1 node with 0 completed stories.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: [],
      url_fragment: 'story1',
      all_node_dicts: [
        {
          id: 'node_1',
          title: 'node1',
          description: 'This is node 1',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }
      ]
    });
    let circumference = (2 * 20 * Math.PI).toString();

    component.ngOnInit();

    expect(component.strokeDashArrayValues).toBe('');
    expect(component.completedStrokeDashArrayValues).toBe('0 ' + circumference);

    // StorySummary with 1 node with 1 completed stories.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: [
        {
          id: 'node_1',
          title: 'node1',
          description: 'This is node 1',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }
      ]
    });

    component.ngOnInit();

    expect(component.strokeDashArrayValues).toBe('');
    expect(component.completedStrokeDashArrayValues).toBe('');

    // StorySummary with 5 node with 3 completed stories.
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3', 'node4', 'node5'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1', 'node2', 'node3'],
      url_fragment: 'story1',
      all_node_dicts: [
        {
          id: 'node_1',
          title: 'node1',
          description: 'This is node 1',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_2',
          title: 'node2',
          description: 'This is node 2',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_3',
          title: 'node3',
          description: 'This is node 3',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_4',
          title: 'node4',
          description: 'This is node 4',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }, {
          id: 'node_5',
          title: 'node5',
          description: 'This is node 5',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Published',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }
      ]
    });

    component.ngOnInit();

    // Here the value is calculated by the formula -> (circumference -
    // (nodeCount * gapLength))/nodeCount = (2 * 20 * Math.PI - (5*5)) / 5
    // = 20.132741228718345. Along with this value, gapLength (5) is also
    // concatenated to the string.
    expect(component.strokeDashArrayValues).toBe('20.132741228718345 5');

    // Here the value for completed nodes is calculated with the same formula.
    // The last is calculated by subtracting the segment length (the value
    // calculated using the formula above) from the circumference .
    expect(component.completedStrokeDashArrayValues).toBe(
      '20.132741228718345 5 20.132741228718345 5' +
      ' 20.132741228718345 55.26548245743669');
  });

  it('should return the chapter URL when the chapter title is provided', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: [
        {
          id: 'node1',
          title: 'Node 1',
          description: 'This is node 1',
          destination_node_ids: [],
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          outline: '',
          outline_is_finalized: true,
          exploration_id: null,
          thumbnail_bg_color: null,
          thumbnail_filename: null,
          status: 'Draft',
          planned_publication_date_msecs: null,
          last_modified_msecs: null,
          first_publication_date_msecs: null,
          unpublishing_reason: null
        }
      ]
    });

    component.ngOnInit();

    expect(component.getChapterUrl('Node which is not present')).toBe('');
    expect(component.getChapterUrl('Node 1')).toBe(
      '/explore/null?story_url_fragment=story1&topic_url_fragment=' +
      'undefined&classroom_url_fragment=undefined&node_id=node1');
  });

  it('should populate the story URL when URL fragments are set', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'fractions';
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    expect(component.getStoryLink()).toBe('/learn/math/fractions/story/story1');
  });

  it('should check if a chapter is completed', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    component.ngOnInit();

    expect(component.isChapterCompleted('node1')).toBe(true);
    expect(component.isChapterCompleted('node2')).toBe(false);
  });

  it('should check if previous chapter is completed', () => {
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    component.ngOnInit();

    // For the first node, we return true.
    expect(component.isPreviousChapterCompleted(0)).toBe(true);
    expect(component.isPreviousChapterCompleted(1)).toBe(true);
    expect(component.isPreviousChapterCompleted(2)).toBe(false);
  });

  it('should show all chapters when user click on \'View All\' button', () => {
    spyOn(wds, 'getWidth').and.returnValue(460);
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    expect(component.initialCount).toBe(undefined);
    expect(component.chaptersDisplayed).toBe(undefined);

    component.ngOnInit();

    expect(component.initialCount).toBe(undefined);
    expect(component.chaptersDisplayed).toBe(1);

    component.showAllChapters();

    expect(component.initialCount).toBe(1);
    expect(component.chaptersDisplayed).toBe(3);
  });

  it('should hide extra chapters when user click on \'View less\'' +
    ' button', () => {
    spyOn(wds, 'getWidth').and.returnValue(460);
    component.storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    });

    expect(component.chaptersDisplayed).toBe(undefined);

    component.ngOnInit();

    expect(component.chaptersDisplayed).toBe(1);

    component.showAllChapters();

    expect(component.chaptersDisplayed).toBe(3);

    component.hideExtraChapters();

    expect(component.chaptersDisplayed).toBe(1);
  });
});
