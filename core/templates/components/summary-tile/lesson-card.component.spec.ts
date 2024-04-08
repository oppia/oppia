import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LessonCardComponent} from './lesson-card.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppConstants} from 'app.constants';

/* Models */
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {StoryNode} from 'domain/story/story-node.model';
/* 
  Combines test cases from:
  - collection-summary-tile (CollectionSummary)
  - exploration-summary-tile (LearnerExplorationSummary)
  - learner-story-summary-tile (StorySummary)
*/
describe('LessonCardComponent', () => {
  let component: LessonCardComponent;
  let fixture: ComponentFixture<LessonCardComponent>;

  let urlInterpolationService: UrlInterpolationService;
  let assetsBackendApiService: AssetsBackendApiService;

  const sampleCollection = {
    last_updated_msec: 1591296737470.528,
    community_owned: false,
    objective: 'Test Objective',
    id: '44LKoKLlIbGe',
    thumbnail_icon_url: '/subjects/Algebra.svg',
    language_code: 'en',
    thumbnail_bg_color: '#cc4b00',
    created_on: 1591296635736.666,
    status: 'public',
    category: 'Algebra',
    title: 'Test Title',
    node_count: 0,
  };

  /* exploration-summary-tile, from community-lessons-tab*/
  const sampleExploration = {
    last_updated_msec: 1591296737470.528,
    community_owned: false,
    objective: 'Test Objective',
    id: '44LKoKLlIbGe',
    num_views: 0,
    thumbnail_icon_url: '/subjects/Algebra.svg',
    human_readable_contributors_summary: {},
    language_code: 'en',
    thumbnail_bg_color: '#cc4b00',
    created_on_msec: 1591296635736.666,
    ratings: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    status: 'public',
    tags: [],
    activity_type: 'exploration',
    category: 'Algebra',
    title: 'Test Title',
  };

  const sampleStoryNode = {
    id: 'node_1',
    thumbnail_filename: 'image.png',
    title: 'Chapter 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: null,
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null,
  };

  const storyNode = StoryNode.createFromBackendDict(sampleStoryNode);

  /* learner-story-summary-tile */
  const sampleTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-title',
    all_node_dicts: [storyNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const sampleTopic2 = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1', 'Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleStoryNode, sampleStoryNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [LessonCardComponent, MockTranslatePipe],
      providers: [UrlInterpolationService, AssetsBackendApiService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonCardComponent);
    component = fixture.componentInstance;

    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
  });

  it('should set story to CollectionSummary and its non-url values to the respective fields', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleCollection.objective);
    expect(component.imgColor).toEqual(sampleCollection.thumbnail_bg_color);
    expect(component.title).toEqual(sampleCollection.title);

    /* temporary until collections are redone */
    expect(component.progress).toEqual(0);
    expect(component.lessonTopic).toEqual('Collections');
  });

  it('should set story to LearnerExplorationSummary and its non-url values to the respective fields', () => {
    component.story =
      LearnerExplorationSummary.createFromBackendDict(sampleExploration);

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleExploration.objective);
    expect(component.imgColor).toEqual(sampleExploration.thumbnail_bg_color);
    expect(component.title).toEqual(sampleExploration.title);

    /* temporary until collections are redone */
    expect(component.progress).toEqual(0);
    expect(component.lessonTopic).toEqual('Community Lessons');
  });

  it('should set story to StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleTopic.title);
    expect(component.imgColor).toEqual(sampleTopic.thumbnail_bg_color);

    let nextStory =
      sampleTopic.completed_node_titles.length -
      (sampleTopic.completed_node_titles.length ===
      sampleTopic.node_titles.length
        ? 1
        : 0);

    expect(component.title).toEqual(
      `Chapter ${nextStory + 1}: ${sampleTopic.node_titles[nextStory]}`
    );
    expect(component.progress).toEqual(
      Math.floor(
        (sampleTopic.completed_node_titles.length /
          sampleTopic.node_titles.length) *
          100
      )
    );
    expect(component.lessonTopic).toEqual(sampleTopic.topic_name);
  });

  it('should set story to CollectionSummary and set its imgUrl correctly', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

    fixture.detectChanges();

    expect(component.imgUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        sampleCollection.thumbnail_icon_url
      )
    );
  });

  it('should set story to StorySummary and set its lessonUrl correctly', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    spyOn(component, 'getStorySummaryLessonUrl');
    fixture.detectChanges();

    let nextStory =
      sampleTopic.completed_node_titles.length -
      (sampleTopic.completed_node_titles.length ===
      sampleTopic.node_titles.length
        ? 1
        : 0);
    expect(component.getStorySummaryLessonUrl).toHaveBeenCalledWith({
      classroom: sampleTopic.classroom_url_fragment,
      topic: sampleTopic.topic_url_fragment,
      currentStory: sampleTopic.all_node_dicts[nextStory],
      story: sampleTopic.url_fragment,
    });
    expect(component.lessonUrl).toBe(
      `/explore/${sampleStoryNode.exploration_id}?topic_url_fragment=${sampleTopic.topic_url_fragment}&classroom_url_fragment=${sampleTopic.classroom_url_fragment}&story_url_fragment=${sampleTopic.url_fragment}&node_id=${sampleStoryNode.id}`
    );
  });

  it('should set story to StorySummary and set its imgUrl correctly', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    expect(component.lessonUrl).toBe(
      assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        sampleTopic.id,
        sampleTopic.thumbnail_filename
      )
    );
  });

  it('should set story to StorySummary and get the correct progress', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic2);
    component.topic = sampleTopic2.topic_name;
    spyOn(component, 'getProgress');
    fixture.detectChanges();

    expect(component.getProgress).toHaveBeenCalledWith(
      Math.floor(
        (sampleTopic2.completed_node_titles.length /
          sampleTopic2.node_titles.length) *
          100
      )
    );
    const progressStyle = component.getProgress(
      Math.floor(
        (sampleTopic2.completed_node_titles.length /
          sampleTopic2.node_titles.length) *
          100
      )
    );
    expect(progressStyle).toBe(
      `linear-gradient(270 deg, #00645c 50%, transparent 50%), linear-gradient(0deg, #00645c 0%, lightgray 0%)`
    );
  });
});
