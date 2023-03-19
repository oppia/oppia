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
 * @fileoverview Unit tests for create learner group page.
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { CreateLearnerGroupPageComponent } from
  './create-learner-group-page.component';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupSubtopicSummary } from
  'domain/learner_group/learner-group-subtopic-summary.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupUserInfo } from
  'domain/learner_group/learner-group-user-info.model';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('CreateLearnerGroupPageComponent', () => {
  let component: CreateLearnerGroupPageComponent;
  let fixture: ComponentFixture<CreateLearnerGroupPageComponent>;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let translateService: TranslateService;
  let clipboard: Clipboard;
  let pageTitleService: PageTitleService;

  const userInfo = LearnerGroupUserInfo.createFromBackendDict({
    username: 'username1',
    error: ''
  });

  const sampleSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5
  };
  const sampleLearnerGroupSubtopicSummary = (
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict));

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
    topic_url_fragment: 'topic'
  };
  const sampleStorySummary = StorySummary.createFromBackendDict(
    sampleStorySummaryBackendDict);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CreateLearnerGroupPageComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    clipboard = TestBed.inject(Clipboard);
    fixture = TestBed.createComponent(CreateLearnerGroupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();
    tick();

    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(component.activeSection).toEqual(
      LearnerGroupPagesConstants.LEARNER_GROUP_CREATION_SECTION_I18N_IDS
        .GROUP_DETAILS);
  }));

  it('should call set page title whenever the language is changed', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');

    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');

    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_CREATE_LEARNER_GROUP_PAGE_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_CREATE_LEARNER_GROUP_PAGE_TITLE');
  });

  it('should set active section correctly', () => {
    component.setActiveSection(
      LearnerGroupPagesConstants.LEARNER_GROUP_CREATION_SECTION_I18N_IDS
        .ADD_SYLLABUS_ITEMS, 2);

    expect(component.activeSection).toEqual(
      LearnerGroupPagesConstants.LEARNER_GROUP_CREATION_SECTION_I18N_IDS
        .ADD_SYLLABUS_ITEMS);
    expect(component.furthestReachedSectionNumber).toEqual(2);
  });

  it('should check if next button on group details section is disabled',
    () => {
      expect(component.isGroupDetailsNextButtonDisabled()).toBeTrue();

      component.learnerGroupTitle = 'title';
      component.learnerGroupDescription = 'description';

      expect(component.isGroupDetailsNextButtonDisabled()).toBeFalse();
    }
  );

  it('should check if next button on add syllabus section is disabled', () => {
    expect(component.isAddSyllabusNextButtonDisabled()).toBeTrue();

    component.learnerGroupStoryIds = ['story_id'];
    expect(component.isAddSyllabusNextButtonDisabled()).toBeFalse();

    component.learnerGroupStoryIds = [];
    component.learnerGroupSubtopicPageIds = ['subtopic_page_id'];
    expect(component.isAddSyllabusNextButtonDisabled()).toBeFalse();
  });

  it('should update learner group properties successfully', () => {
    expect(component.learnerGroupTitle).toBe('');
    expect(component.learnerGroupDescription).toBe('');
    expect(component.learnerGroupStoryIds).toEqual([]);
    expect(component.learnerGroupSubtopicPageIds).toEqual([]);
    expect(component.syllabusSubtopicSummaries).toEqual([]);
    expect(component.syllabusStorySummaries).toEqual([]);
    expect(component.learnerGroupInvitedLearners).toEqual([]);
    expect(component.learnerGroupInvitedLearnersInfo).toEqual([]);

    component.updateLearnerGroupTitle('title');
    component.updateLearnerGroupDesc('description');
    component.updateLearnerGroupStoryIds(['story_id']);
    component.updateLearnerGroupSubtopicIds(['subtopic_page_id']);
    component.updateLearnerGroupSubtopics([sampleLearnerGroupSubtopicSummary]);
    component.updateLearnerGroupStories([sampleStorySummary]);
    component.updateLearnerGroupInvitedLearners(['username1']);
    component.updateLearnerGroupInvitedLearnersInfo([userInfo]);

    expect(component.learnerGroupTitle).toBe('title');
    expect(component.learnerGroupDescription).toBe('description');
    expect(component.learnerGroupStoryIds).toEqual(['story_id']);
    expect(component.learnerGroupSubtopicPageIds).toEqual(
      ['subtopic_page_id']);
    expect(component.syllabusSubtopicSummaries).toEqual(
      [sampleLearnerGroupSubtopicSummary]);
    expect(component.syllabusStorySummaries).toEqual([sampleStorySummary]);
    expect(component.learnerGroupInvitedLearners).toEqual(['username1']);
    expect(component.learnerGroupInvitedLearnersInfo).toEqual([userInfo]);
  });

  it('should get progress tab status class', () => {
    component.furthestReachedSectionNumber = 2;
    expect(component.getProgressTabStatusClass(3)).toBe('incomplete');
    expect(component.getProgressTabStatusClass(2)).toBe('active');
    expect(component.getProgressTabStatusClass(1)).toBe('completed');
  });

  it('should get oppia large avatar url', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      '/avatar/oppia_avatar_large_100px.svg');

    expect(component.getOppiaLargeAvatarUrl()).toBe(
      '/avatar/oppia_avatar_large_100px.svg');
  });

  it('should create new learner group successfully', fakeAsync(() => {
    const learnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1'],
      subtopic_page_ids: ['subtopic_page_id'],
      story_ids: []
    };
    const learnerGroup = LearnerGroupData.createFromBackendDict(
      learnerGroupBackendDict);

    spyOn(learnerGroupBackendApiService, 'createNewLearnerGroupAsync')
      .and.returnValue(Promise.resolve(learnerGroup));

    expect(component.learnerGroup).toBeUndefined();

    component.createLearnerGroup();
    tick();

    expect(component.learnerGroup).toBeDefined();
    expect(component.learnerGroup.id).toBe('groupId');
    expect(component.learnerGroup.title).toBe('title');
    expect(component.learnerGroup.description).toBe('description');
  }));

  it('should correctly copy learner group URL', () => {
    spyOn(clipboard, 'copy');
    let learnerGroupUrl = 'https://oppia.org/create-learner-group/groupID';
    component.learnerGroupUrl = learnerGroupUrl;

    component.copyCreatedGroupUrl();

    expect(clipboard.copy).toHaveBeenCalledWith(learnerGroupUrl);
  });
});
