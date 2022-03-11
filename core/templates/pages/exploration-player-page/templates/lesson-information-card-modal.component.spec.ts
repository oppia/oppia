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
 * @fileoverview Unit tests for lesson information card component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { LessonInformationCardModalComponent } from './lesson-information-card-modal.component';

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('Lesson Information card modal component', () => {
  let fixture: ComponentFixture<LessonInformationCardModalComponent>;
  let componentInstance: LessonInformationCardModalComponent;
  let urlService: UrlService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;

  let expId = 'expId';
  let expTitle = 'Exploration Title';
  let expDesc = 'Exploration Objective';
  let rating: ExplorationRatings;
  let storyId = 'storyId';
  let nodeId = 'nodeId';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        LessonInformationCardModalComponent,
        MockTranslatePipe,
        MockTruncteAndCapitalizePipe,
      ],
      providers: [
        NgbActiveModal,
        PlayerTranscriptService,
        ExplorationEngineService,
        StoryViewerBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonInformationCardModalComponent);
    componentInstance = fixture.componentInstance;

    componentInstance.expInfo = {
      category: '',
      community_owned: true,
      activity_type: '',
      last_updated_msec: 0,
      ratings: rating,
      id: expId,
      created_on_msec: 2,
      human_readable_contributors_summary: {
        'contributer 1': {
          num_commits: 2
        },
        'contributer 2': {
          num_commits: 2
        }
      },
      language_code: '',
      num_views: 3,
      objective: expDesc,
      status: 'private',
      tags: [],
      thumbnail_bg_color: '',
      thumbnail_icon_url: '',
      title: expTitle
    };

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlService = TestBed.inject(UrlService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);

    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
  });

  it('should intialize the component and set values', fakeAsync(() => {
    componentInstance.ngOnInit();
    expect(componentInstance.explorationId).toEqual(expId);
    expect(componentInstance.expTitle).toEqual(expTitle);
    expect(componentInstance.expDesc).toEqual(expDesc);

    expect(componentInstance.expTitleTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_TITLE');
    expect(componentInstance.expDescTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_DESCRIPTION');

    // Translation is only displayed if the language is not English
    // and it's hacky translation is available.
    let hackyExpTitleTranslationIsDisplayed =
      componentInstance.isHackyExpTitleTranslationDisplayed();
    expect(hackyExpTitleTranslationIsDisplayed).toBe(true);
    let hackyExpDescTranslationIsDisplayed =
      componentInstance.isHackyExpDescTranslationDisplayed();
    expect(hackyExpDescTranslationIsDisplayed).toBe(true);
    let hackyStoryTitleTranslationIsDisplayed =
      componentInstance.isHackyStoryTitleTranslationDisplayed();
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(true);
  }));

  it('should set hasStoryTitle true when' +
      'storyId is not undefined',
  fakeAsync(() => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: storyId,
      node_id: nodeId
    });
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        new StoryPlaythrough(storyId, [], 'storyTitle', '', '', '')));
    componentInstance.ngOnInit();
    expect(componentInstance.storyId).toEqual(storyId);
    expect(componentInstance.hasStoryTitle).toEqual(true);
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(urlService.getClassroomUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(urlService.getStoryUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(storyViewerBackendApiService.fetchStoryDataAsync).toHaveBeenCalled();
    expect(componentInstance.storyTitleTranslationKey).toEqual(
      'I18N_STORY_storyId_TITLE');
  }));

  it('should set hasStoryTitle false when' +
      'storyId is undefined',
  fakeAsync(() => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: undefined,
      node_id: undefined
    });
    componentInstance.ngOnInit();
    expect(componentInstance.storyId).toEqual(undefined);
    expect(componentInstance.hasStoryTitle).toBe(false);
  }));

  it('should set value of startedWidth' +
      ' to 0 when completedWidht is 100',
  fakeAsync(() => {
    componentInstance.completedWidth = 100;
    componentInstance.ngOnInit();
    expect(componentInstance.startedWidth).toEqual(0);
  }));
});
