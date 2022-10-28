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
import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlService } from 'services/contextual/url.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { LessonInformationCardModalComponent } from './lesson-information-card-modal.component';
import { LocalStorageService } from 'services/local-storage.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';



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

class MockCheckpointCelebrationUtilityService {
  private isOnCheckpointedState: boolean = false;

  getCheckpointMessage(
      completedCheckpointCount: number, totalCheckpointCount: number
  ): string {
    return (
      'checkpoint ' + completedCheckpointCount + '/' + totalCheckpointCount);
  }

  getIsOnCheckpointedState(): boolean {
    return this.isOnCheckpointedState;
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
  let mockWindowRef: MockWindowRef;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let dateTimeFormatService: DateTimeFormatService;
  let ratingComputationService: RatingComputationService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let userService: UserService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let localStorageService: LocalStorageService;
  let checkpointCelebrationUtilityService:
    CheckpointCelebrationUtilityService;

  let expId = 'expId';
  let expTitle = 'Exploration Title';
  let expDesc = 'Exploration Objective';
  let rating: ExplorationRatings;

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
        DateTimeFormatService,
        RatingComputationService,
        UrlInterpolationService,
        {
          provide: CheckpointCelebrationUtilityService,
          useClass: MockCheckpointCelebrationUtilityService
        },
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
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    ratingComputationService = TestBed.inject(RatingComputationService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
    localStorageService = TestBed.inject(LocalStorageService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    checkpointCelebrationUtilityService = TestBed.inject(
      CheckpointCelebrationUtilityService);

    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValues(true, false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValues(false, true);
  });

  it('should initialize the component', () => {
    spyOn(ratingComputationService, 'computeAverageRating').and.returnValue(3);
    spyOn(componentInstance, 'getLastUpdatedString').and.returnValue('June 28');
    spyOn(componentInstance, 'getExplorationTagsSummary').and.callThrough();

    componentInstance.ngOnInit();

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
    let hackyExpDescTranslationIsDisplayed = (
      componentInstance.isHackyExpDescTranslationDisplayed());
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);
  });

  it('should determine if exploration isn\'t private upon initialization',
    () => {
      componentInstance.expInfo.status = 'public';

      componentInstance.ngOnInit();

      expect(componentInstance.explorationIsPrivate).toBe(false);
    });

  it('should generate checkpoint status array upon initialization', () => {
    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 1;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual(
      ['completed', 'in-progress', 'incomplete']);

    componentInstance.checkpointCount = 1;
    componentInstance.completedCheckpointsCount = 0;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual(
      ['in-progress']);

    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 3;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual(
      ['completed', 'completed', 'completed']);
  });

  it('should get completed progress-bar width', () => {
    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 0;

    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(0);

    componentInstance.completedCheckpointsCount = 1;

    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(25);

    componentInstance.completedCheckpointsCount = 2;

    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(75);
  });

  it('should correctly set logged-out progress learner URL ' +
    'when unique progress URL ID exists', fakeAsync (() => {
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(explorationPlayerStateService, 'getUniqueProgressUrlId')
      .and.returnValue('abcdef');

    componentInstance.ngOnInit();

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef');
  }));

  it('should fetch checkpoint message if on checkpointed state', () => {
    const getIsOnCheckpointedState = spyOn(
      checkpointCelebrationUtilityService, 'getIsOnCheckpointedState').and
      .returnValue(false);
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointMessage').and
      .returnValue('checkpoint message');

    componentInstance.ngOnInit();

    expect(getIsOnCheckpointedState).toHaveBeenCalled();
    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();
    expect(componentInstance.translatedCongratulatoryCheckpointMessage)
      .toBeUndefined();

    getIsOnCheckpointedState.and.returnValue(true);

    componentInstance.ngOnInit();

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .toHaveBeenCalled();
    expect(componentInstance.translatedCongratulatoryCheckpointMessage)
      .toEqual('checkpoint message');
  });

  it('should get image url correctly', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('interpolated_url');

    expect(componentInstance.getStaticImageUrl(imageUrl))
      .toEqual('interpolated_url');
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      imageUrl);
  });

  it('should determine if current language is RTL', () => {
    const isLanguageRTLSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(true);

    expect(componentInstance.isLanguageRTL()).toBe(true);

    isLanguageRTLSpy.and.returnValue(false);

    expect(componentInstance.isLanguageRTL()).toBe(false);
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

  it('should save logged-out learner progress correctly', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setUniqueProgressUrlId')
      .and.returnValue(Promise.resolve());
    spyOn(explorationPlayerStateService, 'getUniqueProgressUrlId')
      .and.returnValue('abcdef');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');

    componentInstance.saveLoggedOutProgress();
    tick(100);

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef');
    expect(componentInstance.loggedOutProgressUniqueUrlId).toEqual('abcdef');
  }));

  it('should store unique progress URL ID when login button is clicked',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('https://oppia.org/login'));
      spyOn(localStorageService, 'updateUniqueProgressIdOfLoggedOutLearner');
      componentInstance.loggedOutProgressUniqueUrlId = 'abcdef';

      expect(mockWindowRef.nativeWindow.location.href).toEqual('');

      componentInstance.onLoginButtonClicked();
      tick(100);

      expect(localStorageService.updateUniqueProgressIdOfLoggedOutLearner)
        .toHaveBeenCalledWith('abcdef');
      expect(mockWindowRef.nativeWindow.location.href).toEqual(
        'https://oppia.org/login');
    })
  );

  it('should correctly close save progress menu', () => {
    componentInstance.saveProgressMenuIsShown = true;

    componentInstance.closeSaveProgressMenu();

    expect(componentInstance.saveProgressMenuIsShown).toBeFalse();
  });
});
