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
 * @fileoverview Unit tests for CertificateOfferingAddTopicItemsComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {CertificateOfferingAddTopicItemsComponent} from './certificate-offering-add-topic-items.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';

describe('Certificate Offering Add Topic Items Component', () => {
  let component: CertificateOfferingAddTopicItemsComponent;
  let fixture: ComponentFixture<CertificateOfferingAddTopicItemsComponent>;
  let classroomBackendApiService: ClassroomBackendApiService;
  let assetsBackendApiService: AssetsBackendApiService;
  let classroomData: ClassroomData;

  beforeEach(() => {
    classroomData = ClassroomData.createFromBackendData(
      'math_classroom_id',
      'Math',
      'math',
      'user@email.com',
      [
        {
          id: 'topic_1',
          name: 'Place Values',
          language_code: 'en',
          description: 'desc',
          version: 1,
          canonical_story_count: 0,
          additional_story_count: 0,
          subtopic_count: 0,
          total_skill_count: 0,
          total_published_node_count: 0,
          uncategorized_skill_count: 0,
          thumbnail_filename: 'thumb.svg',
          thumbnail_bg_color: '#111111',
          topic_model_created_on: 0,
          topic_model_last_updated: 0,
          can_edit_topic: true,
          can_edit_question: true,
          is_published: true,
          total_upcoming_chapters_count: 0,
          total_overdue_chapters_count: 0,
          total_chapter_counts_for_each_story: [],
          published_chapter_counts_for_each_story: [],
          url_fragment: 'place-values',
        },
        {
          id: 'topic_2',
          name: 'Fractions',
          language_code: 'en',
          description: 'desc',
          version: 1,
          canonical_story_count: 0,
          additional_story_count: 0,
          subtopic_count: 0,
          total_skill_count: 0,
          total_published_node_count: 0,
          uncategorized_skill_count: 0,
          thumbnail_filename: 'thumb.svg',
          thumbnail_bg_color: '#222222',
          topic_model_created_on: 0,
          topic_model_last_updated: 0,
          can_edit_topic: true,
          can_edit_question: true,
          is_published: true,
          total_upcoming_chapters_count: 0,
          total_overdue_chapters_count: 0,
          total_chapter_counts_for_each_story: [],
          published_chapter_counts_for_each_story: [],
          url_fragment: 'fractions',
        },
      ],
      'Course details',
      'Topics covered',
      'Teaser text',
      true,
      false,
      {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
      {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
      1
    );
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [CertificateOfferingAddTopicItemsComponent],
      providers: [
        {
          provide: AssetsBackendApiService,
          useValue: {
            getThumbnailUrlForPreview: (
              _entityType: string,
              topicId: string,
              filename: string
            ) => `thumb://${topicId}/${filename}`,
          },
        },
        {
          provide: ClassroomBackendApiService,
          useValue: {
            getAllClassroomsSummaryAsync: async () => [
              {
                classroom_id: 'math_classroom_id',
                name: 'Math',
                url_fragment: 'math',
                teaser_text: '',
                is_published: true,
                thumbnail_filename: '',
                thumbnail_bg_color: '',
              },
            ],
            fetchClassroomDataAsync: async () => classroomData,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingAddTopicItemsComponent
    );
    component = fixture.componentInstance;
    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    component.classroomId = 'math_classroom_id';
    fixture.detectChanges();
    flushMicrotasks();
  }));

  it('should load classroom topics from the selected classroom', fakeAsync(() => {
    flushMicrotasks();

    expect(assetsBackendApiService.getThumbnailUrlForPreview).toBeDefined();
    expect(component.classroomName).toEqual('Math');
    expect(component.availableTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_2',
    ]);
    expect(component.availableTopics[0].thumbnailUrl).toEqual(
      'thumb://topic_1/thumb.svg'
    );
    expect(component.filteredTopics.length).toEqual(2);

    fixture.detectChanges();
    const thumbnailImage: HTMLImageElement | null =
      fixture.nativeElement.querySelector(
        '.oppia-certificate-offering-topic-thumbnail-image'
      );
    expect(thumbnailImage).not.toBeNull();
    expect(thumbnailImage?.getAttribute('src')).toContain(
      'thumb://topic_1/thumb.svg'
    );
  }));

  it('should capitalize the classroom label in the topic step', fakeAsync(() => {
    flushMicrotasks();
    component.classroomName = 'math classroom';

    fixture.detectChanges();

    const classroomLabel: HTMLElement | null =
      fixture.nativeElement.querySelector(
        '.oppia-certificate-offering-classroom-label'
      );

    expect(classroomLabel?.textContent?.trim()).toEqual(
      'Classroom: Math Classroom'
    );
  }));

  it('should emit events correctly when clicking next button', fakeAsync(() => {
    flushMicrotasks();
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(
      component.navigateToReviewAndAvailabilitySection,
      'emit'
    );
    component.certificateAssessmentOffering.topicData = {topic_id_1: 5};
    component.selectedTopics = [
      {
        id: 'topic_id_1',
        title: 'Place Values',
        classroomName: 'Math',
        thumbnailUrl: 'thumb://topic_id_1/thumb.svg',
      },
    ];
    component.selectedTopicIds = new Set(['topic_id_1']);

    component.onNextClicked();

    expect(topicDataChangeSpy).toHaveBeenCalledWith({topic_id_1: 5});
    expect(navigateSpy).toHaveBeenCalled();
  }));

  it('should emit events correctly when clicking back button', fakeAsync(() => {
    flushMicrotasks();
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(component.navigateToDetailsSection, 'emit');
    component.certificateAssessmentOffering.topicData = {topic_id_2: 10};

    component.onBackClicked();

    expect(topicDataChangeSpy).toHaveBeenCalledWith({topic_id_2: 10});
    expect(navigateSpy).toHaveBeenCalled();
  }));

  it('should not emit next events when no topics are selected', fakeAsync(() => {
    flushMicrotasks();
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(
      component.navigateToReviewAndAvailabilitySection,
      'emit'
    );

    component.onNextClicked();

    expect(topicDataChangeSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should initialize selected topics from offering data', fakeAsync(() => {
    flushMicrotasks();
    component.selectedTopics = [];
    component.certificateAssessmentOffering.topicData = {
      topic_1: 1,
      topic_2: 2,
    };

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: CertificateAssessmentOfferingData.createEmpty(),
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_2',
    ]);
  }));

  it('should clear stale selected topics when offering data is empty', fakeAsync(() => {
    flushMicrotasks();
    component.selectedTopics = [component.availableTopics[0]];
    component.selectedTopicIds = new Set([component.availableTopics[0].id]);
    component.certificateAssessmentOffering.topicData = {};

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: {
          ...CertificateAssessmentOfferingData.createEmpty(),
          topicData: {topic_1: 1},
        },
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics).toEqual([]);
    expect(component.selectedTopicIds.size).toEqual(0);
  }));

  it('should preserve topic order from topic data positions', fakeAsync(() => {
    flushMicrotasks();
    component.certificateAssessmentOffering.topicData = {
      topic_1: 1,
      topic_2: 2,
    };

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: CertificateAssessmentOfferingData.createEmpty(),
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_2',
    ]);
  }));

  it('should add and remove topics while syncing topic data', fakeAsync(() => {
    flushMicrotasks();
    const topic = component.availableTopics[0];

    component.toggleTopic(topic);

    expect(component.selectedTopics.map(selected => selected.id)).toEqual([
      topic.id,
    ]);
    expect(component.selectedTopicIds.has(topic.id)).toBeTrue();
    expect(component.certificateAssessmentOffering.topicData).toEqual({
      [topic.id]: 1,
    });

    component.toggleTopic(topic);

    expect(component.selectedTopics).toEqual([]);
    expect(component.selectedTopicIds.has(topic.id)).toBeFalse();
    expect(component.certificateAssessmentOffering.topicData).toEqual({});
  }));

  it('should remove a selected topic and update topic data order', fakeAsync(() => {
    flushMicrotasks();
    const firstTopic = component.availableTopics[0];
    const secondTopic = component.availableTopics[1];
    component.selectedTopics = [firstTopic, secondTopic];
    component.certificateAssessmentOffering.topicData = {
      [firstTopic.id]: 1,
      [secondTopic.id]: 2,
    };

    component.removeSelectedTopic(firstTopic.id);

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      secondTopic.id,
    ]);
    expect(component.certificateAssessmentOffering.topicData).toEqual({
      [secondTopic.id]: 1,
    });
  }));

  it('should filter topics by title and classroom name', fakeAsync(() => {
    flushMicrotasks();
    component.searchQuery = 'math';

    expect(component.filteredTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_2',
    ]);

    component.searchQuery = 'fractions';

    expect(component.filteredTopics.map(topic => topic.id)).toEqual([
      'topic_2',
    ]);
  }));

  it('should show the empty selected-topics message when no topics are selected', fakeAsync(() => {
    flushMicrotasks();
    const emptyStateEl: HTMLElement | null =
      fixture.nativeElement.querySelector(
        '.oppia-certificate-offering-empty-selected-topics'
      );

    expect(emptyStateEl).not.toBeNull();
    expect(emptyStateEl?.textContent?.trim()).toBe(
      'You have not added any topic. Start by adding one!'
    );
  }));

  it('should show an error message when classroom topics fail to load', fakeAsync(() => {
    spyOn(console, 'error');
    spyOn(
      classroomBackendApiService,
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      Promise.resolve([
        {
          classroom_id: 'science_classroom_id',
          name: 'Science',
          url_fragment: 'science',
          teaser_text: '',
          is_published: true,
          thumbnail_filename: '',
          thumbnail_bg_color: '',
        },
      ])
    );

    component.classroomId = 'bad_id';
    component.ngOnChanges({
      classroomId: {
        currentValue: 'bad_id',
        previousValue: 'math_classroom_id',
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    flushMicrotasks();

    expect(component.availableTopics).toEqual([]);
    expect(component.classroomLoadErrorMessage).toEqual(
      'Unable to load topics for this classroom.'
    );
  }));

  it('should clear classroom state when no classroom is selected', fakeAsync(() => {
    flushMicrotasks();
    const classroomSummarySpy = spyOn(
      classroomBackendApiService,
      'getAllClassroomsSummaryAsync'
    );
    const classroomDataSpy = spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    );
    component.availableTopics = [component.availableTopics[0]];
    component.classroomName = 'Old name';
    component.classroomLoadErrorMessage = 'Old error';
    component.certificateAssessmentOffering.topicData = {topic_1: 1};
    component.selectedTopics = [component.availableTopics[0]];
    component.selectedTopicIds = new Set(['topic_1']);

    component.classroomId = '';
    component.ngOnChanges({
      classroomId: {
        currentValue: '',
        previousValue: 'math_classroom_id',
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    flushMicrotasks();

    expect(classroomSummarySpy).not.toHaveBeenCalled();
    expect(classroomDataSpy).not.toHaveBeenCalled();
    expect(component.availableTopics).toEqual([]);
    expect(component.classroomName).toEqual('');
    expect(component.classroomLoadErrorMessage).toEqual('');
    expect(component.selectedTopicIds.has('topic_1')).toBeTrue();
    expect(component.selectedTopics).toEqual([]);
  }));

  it('should show loading state while topics are fetched', fakeAsync(() => {
    let resolveClassroomData: (value: ClassroomData) => void = () => {};
    spyOn(
      classroomBackendApiService,
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(
      Promise.resolve([
        {
          classroom_id: 'math_classroom_id',
          name: 'Math',
          url_fragment: 'math',
          teaser_text: '',
          is_published: true,
          thumbnail_filename: '',
          thumbnail_bg_color: '',
        },
      ])
    );
    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(
      new Promise(resolve => {
        resolveClassroomData = resolve;
      })
    );

    component.classroomId = 'math_classroom_id';
    component.ngOnChanges({
      classroomId: {
        currentValue: 'math_classroom_id',
        previousValue: '',
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.isLoadingTopics).toBeTrue();
    resolveClassroomData(classroomData);
    flushMicrotasks();
    expect(component.isLoadingTopics).toBeFalse();
  }));
});
