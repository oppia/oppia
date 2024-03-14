// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for adding syllabus items to learner group.
 */

import {EventEmitter, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AddSyllabusItemsComponent} from './add-syllabus-items.component';
import {NavigationService} from 'services/navigation.service';
import {TranslateService} from '@ngx-translate/core';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  LearnerGroupSyllabusBackendApiService,
  SyllabusSelectionDetails,
} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerGroupSubtopicSummary} from 'domain/learner_group/learner-group-subtopic-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ConstructTranslationIdsService} from 'services/construct-translation-ids.service';
import {LearnerGroupSyllabus} from 'domain/learner_group/learner-group-syllabus.model';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockNavigationService {
  openSubmenu(evt: KeyboardEvent, menuName: string): void {}

  ACTION_OPEN: string = 'open';
  ACTION_CLOSE: string = 'close';
}

describe('AddSyllabusItemsComponent', () => {
  let component: AddSyllabusItemsComponent;
  let fixture: ComponentFixture<AddSyllabusItemsComponent>;
  let navigationService: NavigationService;
  let translateService: TranslateService;
  let windowDimensionsService: WindowDimensionsService;
  let assetsBackendApiService: AssetsBackendApiService;
  let constructTranslationIdsService: ConstructTranslationIdsService;
  let learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService;
  let languageUtilService: LanguageUtilService;
  let selectionDetailsStub: SyllabusSelectionDetails;

  const sampleSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5,
  };
  const sampleLearnerGroupSubtopicSummary =
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict
    );

  const sampleStorySummaryBackendDict = {
    id: 'story_id_0',
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
  const sampleStorySummary = StorySummary.createFromBackendDict(
    sampleStorySummaryBackendDict
  );

  const mockSyllabusItemsBackendDict = {
    learner_group_id: 'groupId',
    story_summary_dicts: [sampleStorySummaryBackendDict],
    subtopic_summary_dicts: [sampleSubtopicSummaryDict],
  };
  const mockSyllabusItems = LearnerGroupSyllabus.createFromBackendDict(
    mockSyllabusItemsBackendDict
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        AddSyllabusItemsComponent,
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: NavigationService,
          useClass: MockNavigationService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    selectionDetailsStub = {
      types: {
        description: 'Skill',
        itemsName: 'types',
        masterList: [
          {
            id: 'skill',
            text: 'Skill',
          },
          {
            id: 'story',
            text: 'Story',
          },
        ],
        selection: 'skill',
        defaultValue: 'All',
        summary: 'Type',
      },
      categories: {
        description: 'Maths',
        itemsName: 'categories',
        masterList: [
          {
            id: 'math',
            text: 'Maths',
          },
          {
            id: 'science',
            text: 'Science',
          },
        ],
        selection: 'math',
        defaultValue: 'All',
        summary: 'Category',
      },
      languageCodes: {
        description: 'English',
        itemsName: 'languages',
        masterList: [
          {
            id: 'en',
            text: 'English',
          },
          {
            id: 'es',
            text: 'Spanish',
          },
        ],
        selection: 'en',
        defaultValue: 'All',
        summary: 'Language',
      },
    };

    navigationService = TestBed.inject(NavigationService);
    translateService = TestBed.inject(TranslateService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    constructTranslationIdsService = TestBed.inject(
      ConstructTranslationIdsService
    );
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService
    );
    languageUtilService = TestBed.inject(LanguageUtilService);
    fixture = TestBed.createComponent(AddSyllabusItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should determine if mobile view is active', () => {
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(766);
    expect(component.isMobileViewActive()).toBe(true);

    windowWidthSpy.and.returnValue(1000);
    expect(component.isMobileViewActive()).toBe(false);
  });

  it('should open submenu', () => {
    const clickEvent = new KeyboardEvent('click');
    spyOn(navigationService, 'openSubmenu');

    component.openSubmenu(clickEvent, 'category');

    expect(navigationService.openSubmenu).toHaveBeenCalledWith(
      clickEvent,
      'category'
    );
  });

  it('should toggle selection', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(component, 'refreshSearchBarLabels');

    component.ngOnInit();
    component.selectionDetails = selectionDetailsStub;

    component.toggleSelection('categories', 'math');
    component.toggleSelection('categories', 'science');

    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.refreshSearchBarLabels).toHaveBeenCalled();
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  it('should update selection details if a language is selected', () => {
    component.ngOnInit();
    expect(component.selectionDetails.languageCodes.description).toEqual(
      'Language'
    );
    component.selectionDetails = selectionDetailsStub;
    spyOn(translateService, 'instant').and.returnValue('English');
    component.updateSelectionDetails('languageCodes');
    expect(component.selectionDetails.languageCodes.description).toEqual(
      'English'
    );
  });

  it('should refresh search bar labels', () => {
    let testLabel = 'test_label';
    spyOn(translateService, 'instant').and.returnValue(testLabel);
    component.refreshSearchBarLabels();
    expect(component.searchBarPlaceholder).toEqual(testLabel);
    expect(component.categoryButtonText).toEqual(testLabel);
    expect(component.languageButtonText).toEqual(testLabel);
    expect(component.typeButtonText).toEqual(testLabel);
  });

  it('should search dropdown categories', () => {
    spyOn(constructTranslationIdsService, 'getClassroomTitleId');
    expect(component.searchDropdownCategories()).toBeDefined();
  });

  it('should return whether search is in progress', () => {
    component.ngOnInit();
    expect(component.isSearchInProgress()).toBe(false);

    component.searchIsInProgress = true;
    expect(component.isSearchInProgress()).toBe(true);
  });

  it('should search', fakeAsync(() => {
    component.debounceTimeout = 50;
    component.searchQuery = 'hello';
    component.ngOnInit();

    const search = {
      target: {
        value: 'search',
      },
    };

    spyOn(component, 'onSearchQueryChangeExec');
    component.searchToBeExec(search);
    tick(1000);
    expect(component.searchQuery).toBe('search');
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  }));

  it('should execute search when search query is changed', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'searchNewSyllabusItemsAsync'
    ).and.returnValue(Promise.resolve(mockSyllabusItems));
    component.ngOnInit();
    component.selectionDetails = selectionDetailsStub;
    component.selectionDetails.languageCodes.selection = '';
    component.selectionDetails.categories.selection = '';
    component.selectionDetails.types.selection = '';
    component.onSearchQueryChangeExec();
    tick();
    fixture.detectChanges();

    expect(component.storySummaries).toEqual([]);
    expect(component.subtopicSummaries).toEqual([]);

    component.searchQuery = 'dummy topic';
    component.onSearchQueryChangeExec();
    tick();
    fixture.detectChanges();

    expect(component.storySummaries).toEqual(mockSyllabusItems.storySummaries);
    expect(component.subtopicSummaries).toEqual(
      mockSyllabusItems.subtopicPageSummaries
    );
  }));

  it('should initialize', fakeAsync(() => {
    spyOn(component, 'searchDropdownCategories').and.returnValue([]);
    spyOn(languageUtilService, 'getLanguageIdsAndTexts').and.returnValue([]);
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'refreshSearchBarLabels');
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.searchDropdownCategories).toHaveBeenCalled();
    expect(languageUtilService.getLanguageIdsAndTexts).toHaveBeenCalled();
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.refreshSearchBarLabels).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  }));

  it(
    'should call refresh search bar labels whenever the language is ' +
      'changed',
    () => {
      component.ngOnInit();
      spyOn(component, 'refreshSearchBarLabels');

      translateService.onLangChange.emit();

      expect(component.refreshSearchBarLabels).toHaveBeenCalled();
    }
  );

  it('should get subtopic thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/topic/thumbnail/url'
    );

    expect(
      component.getSubtopicThumbnailUrl(sampleLearnerGroupSubtopicSummary)
    ).toEqual('/topic/thumbnail/url');
  });

  it('should get story thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/story/thumbnail/url'
    );

    expect(component.getStoryThumbnailUrl(sampleStorySummary)).toEqual(
      '/story/thumbnail/url'
    );
  });

  it('should add story to syllabus successfully', () => {
    component.ngOnInit();

    expect(component.syllabusStoryIds).toEqual([]);
    expect(component.syllabusStorySummaries).toEqual([]);

    component.addStoryToSyllabus(sampleStorySummary);

    expect(component.syllabusStoryIds).toEqual(['story_id_0']);
    expect(component.syllabusStorySummaries).toEqual([sampleStorySummary]);
  });

  it('should add subtopic to syllabus successfully', () => {
    component.ngOnInit();

    expect(component.syllabusSubtopicPageIds).toEqual([]);
    expect(component.syllabusSubtopicSummaries).toEqual([]);

    component.addSubtopicToSyllabus(sampleLearnerGroupSubtopicSummary);

    expect(component.syllabusSubtopicPageIds).toEqual(['topicId1:1']);
    expect(component.syllabusSubtopicSummaries).toEqual([
      sampleLearnerGroupSubtopicSummary,
    ]);
  });

  it('should remove story from syllabus successfully', () => {
    component.syllabusStoryIds = ['story_id_0'];
    component.syllabusStorySummaries = [sampleStorySummary];

    component.removeStoryFromSyllabus('story_id_0');

    expect(component.syllabusStoryIds).toEqual([]);
    expect(component.syllabusStorySummaries).toEqual([]);
  });

  it('should remove subtopic from syllabus successfully', () => {
    component.syllabusSubtopicPageIds = ['topicId1:1'];
    component.syllabusSubtopicSummaries = [sampleLearnerGroupSubtopicSummary];

    component.removeSubtopicFromSyllabus('topicId1:1');

    expect(component.syllabusSubtopicPageIds).toEqual([]);
    expect(component.syllabusSubtopicSummaries).toEqual([]);
  });

  it('should check if a subtopic is part of the added syllabus', () => {
    component.syllabusSubtopicPageIds = ['topicId1:1', 'topicId2:3'];

    expect(component.isSubtopicPartOfAddedSyllabus('topicId1:1')).toBe(true);
    expect(component.isSubtopicPartOfAddedSyllabus('topicId2:3')).toBe(true);
    expect(component.isSubtopicPartOfAddedSyllabus('topicId3:4')).toBe(false);
  });

  it('should check if a story is part of the added syllabus', () => {
    component.syllabusStoryIds = ['story_id_0'];

    expect(component.isStoryPartOfAddedSyllabus('story_id_0')).toBe(true);
    expect(component.isStoryPartOfAddedSyllabus('story_id_1')).toBe(false);
  });
});
