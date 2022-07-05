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

import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlService } from 'services/contextual/url.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { LessonInformationCardModalComponent } from './lesson-information-card-modal.component';
import { LocalStorageService } from 'services/local-storage.service';

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
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
  let userService: UserService;
  let mockWindowRef: MockWindowRef;
  let editableExplorationBackendApiService:
  EditableExplorationBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let localStorageService: LocalStorageService;
  let clipboard: Clipboard;

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
      ],
      providers: [
        NgbActiveModal,
        PlayerTranscriptService,
        ExplorationEngineService,
        StoryViewerBackendApiService,
        EditableExplorationBackendApiService,
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
    userService = TestBed.inject(UserService);
    localStorageService = TestBed.inject(LocalStorageService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    clipboard = TestBed.inject(Clipboard);

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
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        new StoryPlaythrough(storyId, [], 'storyTitle', '', '', '')));

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

  it('should correctly set logged-out progress learner URL ' +
    'when unique progress URL ID exists', fakeAsync (() => {
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        new StoryPlaythrough(storyId, [], 'storyTitle', '', '', '')));
    spyOn(explorationPlayerStateService, 'getUniqueProgressUrlId')
      .and.returnValue('abcdef');

    componentInstance.ngOnInit();

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef');
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

  it('should toggle authors dropdown menu being shown correctly', () => {
    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(false);
    componentInstance.toggleLessonAuthorsSubmenu();
    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(true);
    componentInstance.toggleLessonAuthorsSubmenu();
    expect(componentInstance.lessonAuthorsSubmenuIsShown).toEqual(false);
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

  it('should correctly copy progress URL', () => {
    spyOn(clipboard, 'copy');
    let loggedOutProgressUrl = 'https://oppia.org/progress/abcdef';
    componentInstance.loggedOutProgressUniqueUrl = loggedOutProgressUrl;

    componentInstance.copyProgressUrl();

    expect(clipboard.copy).toHaveBeenCalledWith(
      loggedOutProgressUrl);
  });

  it('should store unique progress URL ID when login button is clicked',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('https://oppia.org/login'));
      spyOn(localStorageService, 'updateUniqueProgressIdOfLoggedOutLearner');
      componentInstance.loggedOutProgressUniqueUrlId = 'abcdef';

      componentInstance.onLoginButtonClicked();
      tick(100);

      expect(localStorageService.updateUniqueProgressIdOfLoggedOutLearner)
        .toHaveBeenCalledWith('abcdef');
    })
  );

  it('should correctly close save progress menu', () => {
    componentInstance.saveProgressMenuIsShown = true;

    componentInstance.closeSaveProgressMenu();

    expect(componentInstance.saveProgressMenuIsShown).toBeFalse();
  });
});
