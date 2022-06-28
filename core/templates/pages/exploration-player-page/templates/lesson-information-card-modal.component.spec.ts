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
 * @fileoverview Unit tests for lesson information card modal component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { LessonInformationCardModalComponent } from './lesson-information-card-modal.component';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'summarizeNonnegativeNumber'})
export class MockSummarizeNonnegativeNumberPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({name: 'limitTo'})
export class MockLimitToPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      }
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {}
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        }
      }
    }
  };
}

describe('Lesson Information card modal component', () => {
  let fixture: ComponentFixture<LessonInformationCardModalComponent>;
  let componentInstance: LessonInformationCardModalComponent;
  let urlService: UrlService;
  let mockWindowRef: MockWindowRef;
  let editableExplorationBackendApiService:
  EditableExplorationBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let dateTimeFormatService: DateTimeFormatService;
  let ratingComputationService: RatingComputationService;
  let urlInterpolationService: UrlInterpolationService;

  let expId = 'expId';
  let expTitle = 'Exploration Title';
  let expDesc = 'Exploration Objective';
  let rating: ExplorationRatings;
  let storyId = 'storyId';

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        LessonInformationCardModalComponent,
        MockTranslatePipe,
        MockTruncteAndCapitalizePipe,
        MockSummarizeNonnegativeNumberPipe,
        MockLimitToPipe
      ],
      providers: [
        NgbActiveModal,
        PlayerTranscriptService,
        ExplorationEngineService,
        StoryViewerBackendApiService,
        EditableExplorationBackendApiService,
        DateTimeFormatService,
        RatingComputationService,
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
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
      num_views: 100,
      objective: expDesc,
      status: 'private',
      tags: ['tag1', 'tag2'],
      thumbnail_bg_color: '#fff',
      thumbnail_icon_url: 'icon_url',
      title: expTitle
    };

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlService = TestBed.inject(UrlService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    ratingComputationService = TestBed.inject(RatingComputationService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValues(true, true, false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValues(false, false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should initialize the component and set values' +
    ' when storyId is present', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        new StoryPlaythrough(storyId, [], 'storyTitle', '', '', '')));
    spyOn(ratingComputationService, 'computeAverageRating').and.returnValue(3);
    spyOn(componentInstance, 'getLastUpdatedString').and.returnValue('June 28');
    spyOn(componentInstance, 'getExplorationTagsSummary').and.callThrough();


    expect(componentInstance.storyId).toEqual(undefined);
    expect(componentInstance.storyTitleIsPresent).toEqual(undefined);
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).not.toHaveBeenCalled();
    expect(urlService.getClassroomUrlFragmentFromLearnerUrl).
      not.toHaveBeenCalled();
    expect(urlService.getStoryUrlFragmentFromLearnerUrl).
      not.toHaveBeenCalled();
    expect(storyViewerBackendApiService.fetchStoryDataAsync).
      not.toHaveBeenCalled();
    expect(componentInstance.storyTitleTranslationKey).toEqual(undefined);

    componentInstance.ngOnInit();
    tick(1000);

    expect(componentInstance.storyTitleIsPresent).toEqual(true);
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(urlService.getClassroomUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(urlService.getStoryUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(storyViewerBackendApiService.fetchStoryDataAsync).toHaveBeenCalled();
    expect(componentInstance.storyId).toEqual(storyId);
    expect(componentInstance.storyTitleTranslationKey).toEqual(
      'I18N_STORY_storyId_TITLE');

    expect(componentInstance.explorationId).toEqual(expId);
    expect(componentInstance.expTitle).toEqual(expTitle);
    expect(componentInstance.expDesc).toEqual(expDesc);
    expect(componentInstance.averageRating).toBe(3);
    expect(componentInstance.numViews).toBe(100);
    expect(componentInstance.lastUpdatedString).toBe('June 28');
    expect(componentInstance.explorationIsPrivate).toBe(true);
    expect(componentInstance.explorationTags).toEqual({
      tagsToShow: ['tag1', 'tag2'],
      tagsInTooltip: []
    });
    expect(componentInstance.infoCardBackgroundCss).toEqual({
      'background-color': '#fff'
    });
    expect(componentInstance.infoCardBackgroundImageUrl).toEqual('icon_url');

    expect(componentInstance.expTitleTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_TITLE');
    expect(componentInstance.expDescTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_DESCRIPTION');

    // Translation is only displayed if the language is not English
    // and it's hacky translation is available.
    let hackyExpTitleTranslationIsDisplayed = (
      componentInstance.isHackyExpTitleTranslationDisplayed());
    expect(hackyExpTitleTranslationIsDisplayed).toBe(true);
    let hackyStoryTitleTranslationIsDisplayed = (
      componentInstance.isHackyStoryTitleTranslationDisplayed());
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(true);
    let hackyExpDescTranslationIsDisplayed = (
      componentInstance.isHackyExpDescTranslationDisplayed());
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);
  }));

  it('should determine if exploration isn\'t private', () => {
    componentInstance.expInfo.status = 'public';

    componentInstance.ngOnInit();

    expect(componentInstance.explorationIsPrivate).toBe(false);
  });

  it('should correctly set story title' +
      ' when storyId is not present',
  fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(false);

    expect(componentInstance.storyId).toEqual(undefined);
    expect(componentInstance.storyTitleIsPresent).toEqual(undefined);

    componentInstance.ngOnInit();

    expect(componentInstance.storyId).toEqual(undefined);
    expect(componentInstance.storyTitleIsPresent).toBe(false);
  }));

  it('should restart the exploration and reset the progress', fakeAsync(() => {
    let resetSpy = spyOn(
      editableExplorationBackendApiService, 'resetExplorationProgressAsync')
      .and.returnValue(Promise.resolve());
    spyOn(mockWindowRef.nativeWindow.location, 'reload');

    componentInstance.restartExploration();

    fixture.whenStable().then(() => {
      expect(resetSpy).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    });
  }));

  it('should get RTL language status correctly', () => {
    expect(componentInstance.isLanguageRTL()).toBeTrue();
  });

  it('should get get image url correctly', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('interpolated_url');

    expect(componentInstance.getStaticImageUrl(imageUrl))
      .toEqual('interpolated_url');
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      imageUrl);
  });

  it('should get exploration tags summary', () => {
    let arrayOfTags = ['tag1', 'tag2'];

    expect(componentInstance.getExplorationTagsSummary(['tag1', 'tag2']))
      .toEqual({
        tagsToShow: arrayOfTags,
        tagsInTooltip: []
      });

    arrayOfTags = [
      'this is a long tag.', 'this is also a long tag',
      'this takes the tags length past 45 characters'];

    expect(componentInstance.getExplorationTagsSummary(arrayOfTags)).toEqual({
      tagsToShow: [arrayOfTags[0], arrayOfTags[1]],
      tagsInTooltip: [arrayOfTags[2]]
    });
  });

  it('should get updated string', () => {
    let dateTimeString = 'datetime_string';
    spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue(dateTimeString);

    expect(componentInstance.getLastUpdatedString(12)).toEqual(dateTimeString);
  });

  it('should provide title wrapper', () => {
    let titleHeight = 20;
    spyOn(document, 'querySelectorAll').and.returnValue([{
      clientWidth: titleHeight + 20
    }] as unknown as NodeListOf<Element>);

    expect(componentInstance.titleWrapper()).toEqual({
      'word-wrap': 'break-word',
      width: titleHeight.toString()
    });
  });

  it('should toggle authors dropdown menu being shown correctly', () => {
    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(false);

    componentInstance.toggleLessonAuthorsSubmenu();

    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(true);

    componentInstance.toggleLessonAuthorsSubmenu();

    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(false);
  });
});
