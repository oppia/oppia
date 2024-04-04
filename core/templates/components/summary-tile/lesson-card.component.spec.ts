import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LessonCardComponent} from './lesson-card.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

/* Models */
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
/* 
  Combines test cases from:
  - collection-summary-tile (CollectionSummary)
  - exploration-summary-tile (LearnerExplorationSummary)
  - learner-story-summary-tile (StorySummary)
*/
describe('LessonCardComponent', () => {
  let component: LessonCardComponent;
  let fixture: ComponentFixture<LessonCardComponent>;

  let i18nLanguageCodeService: I18nLanguageCodeService;
  let assetsBackendApiService: AssetsBackendApiService;

  /* need to create a mocktranslate & assets service providers */
  /* collection-summary-tile */
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
    all_node_dicts: [],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [LessonCardComponent, MockTranslatePipe],
      providers: [AssetsBackendApiService, I18nLanguageCodeService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonCardComponent);
    component = fixture.componentInstance;

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    /*component.story = StorySummary.createFromBackendDict(
      sampleTopic
    );
    fixture.detectChanges();*/
  });

  it('should set story to CollectionSummary and its non-url values to the respective fields', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

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

    expect(component.desc).toEqual(sampleExploration.objective);
    expect(component.imgColor).toEqual(sampleExploration.thumbnail_bg_color);
    expect(component.title).toEqual(sampleExploration.title);

    /* temporary until collections are redone */
    expect(component.progress).toEqual(0);
    expect(component.lessonTopic).toEqual('Community Lessons');
  });

  it('should set story to StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);

    expect(component.desc).toEqual(sampleTopic.title);
    expect(component.imgColor).toEqual(sampleTopic.thumbnail_bg_color);

    //need another topic
    //need to create a mockmodel of the storysummary and call its functions
    /**
     * If Story is a model and not a service, and you need to
     * test the initialization code that relies on methods of this model, you can still achieve it by mocking the Story model and its methods
     */
    expect(component.title).toEqual(sampleTopic.title);
  });
});
