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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, Pipe, PipeTransform} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {ExplorationRatings} from 'domain/summary/learner-exploration-summary.model';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {LessonInformationCardModalComponent} from './lesson-information-card-modal.component';
import {LocalStorageService} from 'services/local-storage.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';
import {CheckpointCelebrationUtilityService} from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import {StateObjectsBackendDict} from 'domain/exploration/StatesObjectFactory';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';

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
    completedCheckpointCount: number,
    totalCheckpointCount: number
  ): string {
    return (
      'checkpoint ' + completedCheckpointCount + '/' + totalCheckpointCount
    );
  }

  getIsOnCheckpointedState(): boolean {
    return this.isOnCheckpointedState;
  }

  getStateListForCheckpointMessages(
    statesbackendDict: StateObjectsBackendDict,
    initStateName: string
  ): string[] {
    return [];
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
      },
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {},
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        },
      },
    },
  };
}

const dummyExplorationBackendDict = {
  init_state_name: 'Introduction',
  param_changes: [],
  param_specs: {},
  states: {
    Introduction: {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          buttonText: {
            value: 'Continue',
          },
        },
        default_outcome: {
          dest: 'Middle State',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: true,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'Continue',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: true,
    },
    'Middle State': {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          buttonText: {
            value: 'Continue',
          },
        },
        default_outcome: {
          dest: 'End State',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: true,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'Continue',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: true,
    },
    'End State': {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          recommendedExplorationIds: {
            value: [],
          },
        },
        default_outcome: null,
        hints: [],
        solution: null,
        id: 'EndExploration',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    },
  },
  title: 'Dummy Title',
  language_code: 'en',
  objective: 'Dummy Objective',
  next_content_id_index: 4,
};

const dummyExplorationMetadata = {
  title: 'Dummy Title',
  category: 'Dummy Category',
  objective: 'Dummy Objective',
  language_code: 'en',
  tags: [],
  blurb: 'Dummy Blurb',
  author_notes: 'Dummy Author Notes',
  states_schema_version: 50,
  init_state_name: 'Introduction',
  param_specs: {},
  param_changes: [],
  auto_tts_enabled: false,
  edits_allowed: true,
};

const dummyExplorationBackendResponse = {
  can_edit: true,
  exploration: dummyExplorationBackendDict,
  exploration_metadata: dummyExplorationMetadata,
  exploration_id: 'expId',
  is_logged_in: true,
  session_id: 'dummy_session_id',
  version: 1,
  preferred_audio_language_code: 'en',
  preferred_language_codes: ['en'],
  auto_tts_enabled: false,
  record_playthrough_probability: 1.0,
  draft_change_list_id: 1,
  has_viewed_lesson_info_modal_once: false,
  furthest_reached_checkpoint_exp_version: 0,
  furthest_reached_checkpoint_state_name: '',
  most_recently_reached_checkpoint_state_name: 'Introduction',
  most_recently_reached_checkpoint_exp_version: 0,
  displayable_language_codes: [],
};

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
  let playerTranscriptService: PlayerTranscriptService;
  let localStorageService: LocalStorageService;
  let checkpointCelebrationUtilityService: CheckpointCelebrationUtilityService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let playerPositionService: PlayerPositionService;

  let expId = 'expId';
  let expTitle = 'Exploration Title';
  let expDesc = 'Exploration Objective';
  let expCategory = 'Exploration Category';
  let rating: ExplorationRatings;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LessonInformationCardModalComponent,
        MockTranslatePipe,
        MockTruncteAndCapitalizePipe,
        MockSummarizeNonnegativeNumberPipe,
        MockLimitToPipe,
      ],
      providers: [
        NgbActiveModal,
        PlayerTranscriptService,
        ExplorationEngineService,
        DateTimeFormatService,
        RatingComputationService,
        UrlInterpolationService,
        ReadOnlyExplorationBackendApiService,
        {
          provide: CheckpointCelebrationUtilityService,
          useClass: MockCheckpointCelebrationUtilityService,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonInformationCardModalComponent);
    componentInstance = fixture.componentInstance;

    componentInstance.expInfo = {
      category: expCategory,
      community_owned: true,
      activity_type: '',
      last_updated_msec: 0,
      ratings: rating,
      id: expId,
      created_on_msec: 2,
      human_readable_contributors_summary: {
        'contributer 1': {
          num_commits: 2,
        },
        'contributer 2': {
          num_commits: 2,
        },
      },
      language_code: '',
      num_views: 100,
      objective: expDesc,
      status: 'private',
      tags: ['tag1', 'tag2'],
      thumbnail_bg_color: '#fff',
      thumbnail_icon_url: 'icon_url',
      title: expTitle,
    };

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    ratingComputationService = TestBed.inject(RatingComputationService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    localStorageService = TestBed.inject(LocalStorageService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    checkpointCelebrationUtilityService = TestBed.inject(
      CheckpointCelebrationUtilityService
    );

    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );

    playerPositionService = TestBed.inject(PlayerPositionService);

    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValues(true, false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValues(
      false,
      true
    );
  });

  it('should initialize the component', () => {
    spyOn(ratingComputationService, 'computeAverageRating').and.returnValue(3);
    spyOn(componentInstance, 'getLastUpdatedString').and.returnValue('June 28');
    spyOn(componentInstance, 'getExplorationTagsSummary').and.callThrough();

    componentInstance.ngOnInit();

    expect(componentInstance.explorationId).toEqual(expId);
    expect(componentInstance.expTitle).toEqual(expTitle);
    expect(componentInstance.expDesc).toEqual(expDesc);
    expect(componentInstance.expCategory).toEqual(expCategory);
    expect(componentInstance.averageRating).toBe(3);
    expect(componentInstance.numViews).toBe(100);
    expect(componentInstance.lastUpdatedString).toBe('June 28');
    expect(componentInstance.explorationIsPrivate).toBe(true);
    expect(componentInstance.explorationTags).toEqual({
      tagsToShow: ['tag1', 'tag2'],
      tagsInTooltip: [],
    });
    expect(componentInstance.infoCardBackgroundCss).toEqual({
      'background-color': '#fff',
    });
    expect(componentInstance.infoCardBackgroundImageUrl).toEqual('icon_url');

    expect(componentInstance.expTitleTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_TITLE'
    );
    expect(componentInstance.expDescTranslationKey).toEqual(
      'I18N_EXPLORATION_expId_DESCRIPTION'
    );

    // Translation is only displayed if the language is not English
    // and it's hacky translation is available.
    let hackyExpTitleTranslationIsDisplayed =
      componentInstance.isHackyExpTitleTranslationDisplayed();
    expect(hackyExpTitleTranslationIsDisplayed).toBe(true);
    let hackyExpDescTranslationIsDisplayed =
      componentInstance.isHackyExpDescTranslationDisplayed();
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);
  });

  it("should determine if exploration isn't private upon initialization", () => {
    componentInstance.expInfo.status = 'public';

    componentInstance.ngOnInit();

    expect(componentInstance.explorationIsPrivate).toBe(false);
  });

  it('should throw error if unique url id is null', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('https://oppia.org/login')
    );
    componentInstance.loggedOutProgressUniqueUrlId = null;
    expect(() => {
      componentInstance.onLoginButtonClicked();
      tick();
    }).toThrowError();
  }));

  it('should generate checkpoint status array upon initialization', () => {
    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 1;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual([
      'completed',
      'in-progress',
      'incomplete',
    ]);

    componentInstance.checkpointCount = 1;
    componentInstance.completedCheckpointsCount = 0;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual(['in-progress']);

    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 3;

    componentInstance.ngOnInit();

    expect(componentInstance.checkpointStatusArray).toEqual([
      'completed',
      'completed',
      'completed',
    ]);
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

  it('should not go to invalid or incomplete checkpoint index', () => {
    componentInstance.checkpointCount = 4;
    componentInstance.completedCheckpointsCount = 2;

    componentInstance.ngOnInit();

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(-1);
    }).toThrowError('Checkpoint index out of bounds.');

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(4);
    }).toThrowError('Checkpoint index out of bounds.');

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(3);
    }).toThrowError('Checkpoint not reached yet.');

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(2);
    }).toThrowError('Checkpoint not reached yet.');
  });

  it('should go to checkpoint index', fakeAsync(() => {
    let mockStates = dummyExplorationBackendDict.states;
    let mockInitStateName = dummyExplorationBackendDict.init_state_name;
    const checkpointIndex = 1;
    componentInstance.checkpointCount = 2;
    componentInstance.completedCheckpointsCount = 2;

    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(Promise.resolve(dummyExplorationBackendResponse));

    componentInstance.ngOnInit();
    tick();
    componentInstance.exploration.init_state_name = null;

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(checkpointIndex);
    }).toThrowError('Exploration or its properties are undefined.');

    componentInstance.exploration.init_state_name = mockInitStateName;

    spyOn(
      checkpointCelebrationUtilityService,
      'getStateListForCheckpointMessages'
    )
      .withArgs(mockStates, mockInitStateName)
      .and.returnValue(['Introduction', 'Middle State']);

    spyOn(playerTranscriptService, 'findIndexOfLatestStateWithName')
      .withArgs('Middle State')
      .and.returnValues(null, 1);

    expect(() => {
      componentInstance.validateIndexAndGoToCheckpoint(checkpointIndex);
    }).toThrowError('Checkpoint state card index is null.');

    spyOn(playerPositionService, 'setDisplayedCardIndex');

    componentInstance.validateIndexAndGoToCheckpoint(checkpointIndex);

    expect(playerPositionService.setDisplayedCardIndex).toHaveBeenCalledWith(
      checkpointIndex
    );
  }));

  it(
    'should correctly set logged-out progress learner URL ' +
      'when unique progress URL ID exists',
    fakeAsync(() => {
      spyOn(
        explorationPlayerStateService,
        'isInStoryChapterMode'
      ).and.returnValue(true);
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        ''
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('');
      spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        ''
      );
      spyOn(
        explorationPlayerStateService,
        'getUniqueProgressUrlId'
      ).and.returnValue('abcdef');

      componentInstance.ngOnInit();

      expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
        'https://oppia.org/progress/abcdef'
      );
    })
  );

  it('should fetch checkpoint message if on checkpointed state', () => {
    const getIsOnCheckpointedState = spyOn(
      checkpointCelebrationUtilityService,
      'getIsOnCheckpointedState'
    ).and.returnValue(false);
    spyOn(
      checkpointCelebrationUtilityService,
      'getCheckpointMessage'
    ).and.returnValue('checkpoint message');

    componentInstance.ngOnInit();

    expect(getIsOnCheckpointedState).toHaveBeenCalled();
    expect(
      checkpointCelebrationUtilityService.getCheckpointMessage
    ).not.toHaveBeenCalled();
    expect(
      componentInstance.translatedCongratulatoryCheckpointMessage
    ).toBeUndefined();

    getIsOnCheckpointedState.and.returnValue(true);

    componentInstance.ngOnInit();

    expect(
      checkpointCelebrationUtilityService.getCheckpointMessage
    ).toHaveBeenCalled();
    expect(componentInstance.translatedCongratulatoryCheckpointMessage).toEqual(
      'checkpoint message'
    );
  });

  it('should get image url correctly', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'interpolated_url'
    );

    expect(componentInstance.getStaticImageUrl(imageUrl)).toEqual(
      'interpolated_url'
    );
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      imageUrl
    );
  });

  it('should determine if current language is RTL', () => {
    const isLanguageRTLSpy = spyOn(
      i18nLanguageCodeService,
      'isCurrentLanguageRTL'
    ).and.returnValue(true);

    expect(componentInstance.isLanguageRTL()).toBe(true);

    isLanguageRTLSpy.and.returnValue(false);

    expect(componentInstance.isLanguageRTL()).toBe(false);
  });

  it('should get exploration tags summary', () => {
    let arrayOfTags = ['tag1', 'tag2'];

    expect(
      componentInstance.getExplorationTagsSummary(['tag1', 'tag2'])
    ).toEqual({
      tagsToShow: arrayOfTags,
      tagsInTooltip: [],
    });

    arrayOfTags = [
      'this is a long tag.',
      'this is also a long tag',
      'this takes the tags length past 45 characters',
    ];

    expect(componentInstance.getExplorationTagsSummary(arrayOfTags)).toEqual({
      tagsToShow: [arrayOfTags[0], arrayOfTags[1]],
      tagsInTooltip: [arrayOfTags[2]],
    });
  });

  it('should get updated string', () => {
    let dateTimeString = 'datetime_string';
    spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue(dateTimeString);

    expect(componentInstance.getLastUpdatedString(12)).toEqual(dateTimeString);
  });

  it('should save logged-out learner progress correctly', fakeAsync(() => {
    spyOn(
      explorationPlayerStateService,
      'setUniqueProgressUrlId'
    ).and.returnValue(Promise.resolve());
    spyOn(
      explorationPlayerStateService,
      'getUniqueProgressUrlId'
    ).and.returnValue('abcdef');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');

    componentInstance.saveLoggedOutProgress();
    tick(100);

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef'
    );
    expect(componentInstance.loggedOutProgressUniqueUrlId).toEqual('abcdef');
  }));

  it('should store unique progress URL ID when login button is clicked', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('https://oppia.org/login')
    );
    spyOn(localStorageService, 'updateUniqueProgressIdOfLoggedOutLearner');
    componentInstance.loggedOutProgressUniqueUrlId = 'abcdef';

    expect(mockWindowRef.nativeWindow.location.href).toEqual('');

    componentInstance.onLoginButtonClicked();
    tick(100);

    expect(
      localStorageService.updateUniqueProgressIdOfLoggedOutLearner
    ).toHaveBeenCalledWith('abcdef');
    expect(mockWindowRef.nativeWindow.location.href).toEqual(
      'https://oppia.org/login'
    );
  }));

  it('should correctly close save progress menu', () => {
    componentInstance.saveProgressMenuIsShown = true;

    componentInstance.closeSaveProgressMenu();

    expect(componentInstance.saveProgressMenuIsShown).toBeFalse();
  });

  it('should return 0% when no checkpoints are completed', () => {
    componentInstance.completedCheckpointsCount = 0;
    componentInstance.checkpointCount = 5;

    expect(componentInstance.getProgressPercentage()).toEqual('0');
  });

  it('should return 100% when all checkpoints are completed', () => {
    componentInstance.completedCheckpointsCount = 5;
    componentInstance.checkpointCount = 5;

    expect(componentInstance.getProgressPercentage()).toEqual('100');
  });

  it('should return the correct percentage for 25% progress', () => {
    componentInstance.completedCheckpointsCount = 1;
    componentInstance.checkpointCount = 4;

    expect(componentInstance.getProgressPercentage()).toEqual('25');
  });

  it('should round down to the nearest whole number', () => {
    componentInstance.completedCheckpointsCount = 2;
    componentInstance.checkpointCount = 7;

    expect(componentInstance.getProgressPercentage()).toEqual('28');
  });
});
