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
 * @fileoverview Unit tests for LessonExitService.
 */

import {TestBed} from '@angular/core/testing';
import {UrlService} from 'services/contextual/url.service';
import {LocalStorageService} from 'services/local-storage.service';
import {
  LEARNER_DASHBOARD_URL,
  LessonExitService,
  POST_SIGN_IN_EXIT_INTENT_TTL_MSEC,
} from './lesson-exit.service';

describe('LessonExitService', () => {
  let service: LessonExitService;
  let urlService: UrlService;
  let localStorageService: LocalStorageService;

  const makeCurated = (): void => {
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'fractions'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story'
    );
    spyOn(urlService, 'getLearnerTopicStoryUrl').and.returnValue(
      '/learn/math/fractions/story'
    );
  };

  const makeCommunity = (collectionId: string | null): void => {
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.throwError(
      'Invalid URL for classroom'
    );
    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      collectionId
    );
  };

  beforeEach(() => {
    service = TestBed.inject(LessonExitService);
    urlService = TestBed.inject(UrlService);
    localStorageService = TestBed.inject(LocalStorageService);
    localStorageService.removePostSignInExitIntent();
  });

  afterEach(() => {
    localStorageService.removePostSignInExitIntent();
    localStorageService.setLessonExitModalHidden('learner', false);
  });

  describe('getExitUrl', () => {
    it('should return the topic page for a curated lesson', () => {
      makeCurated();

      expect(service.isCuratedLesson()).toBeTrue();
      expect(service.getExitUrl()).toBe('/learn/math/fractions/story');
    });

    it('should return the collection page for a collection lesson', () => {
      makeCommunity('col1');

      expect(service.isCuratedLesson()).toBeFalse();
      expect(service.getExitUrl()).toBe('/collection/col1');
    });

    it('should return the community library otherwise', () => {
      makeCommunity(null);

      expect(service.getExitUrl()).toBe('/community-library');
    });

    it('should not treat a lesson with a missing fragment as curated', () => {
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('math');
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'fractions'
      );
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );

      expect(service.isCuratedLesson()).toBeFalse();
    });
  });

  describe('exit modal preference', () => {
    it('should remember the preference per user', () => {
      expect(service.isExitModalHidden('learner')).toBeFalse();

      service.hideExitModal('learner');

      expect(service.isExitModalHidden('learner')).toBeTrue();
      expect(service.isExitModalHidden('someone_else')).toBeFalse();
    });
  });

  describe('sign-in intent', () => {
    it('should store the topic page as destination for a curated lesson', () => {
      makeCurated();

      service.saveSignInIntent('exp1');
      const intent = service.consumeSignInIntent('exp1');

      expect(intent?.destinationUrl).toBe('/learn/math/fractions/story');
    });

    it('should store the learner dashboard as destination otherwise', () => {
      makeCommunity(null);

      service.saveSignInIntent('exp1');
      const intent = service.consumeSignInIntent('exp1');

      expect(intent?.destinationUrl).toBe(LEARNER_DASHBOARD_URL);
      expect(LEARNER_DASHBOARD_URL).toBe('/learner-dashboard');
    });

    it('should only hand the intent out once', () => {
      makeCommunity(null);
      service.saveSignInIntent('exp1');

      expect(service.consumeSignInIntent('exp1')).not.toBeNull();
      expect(service.consumeSignInIntent('exp1')).toBeNull();
    });

    it('should ignore an intent for a different exploration', () => {
      makeCommunity(null);
      service.saveSignInIntent('exp1');

      expect(service.consumeSignInIntent('exp2')).toBeNull();
      expect(service.consumeSignInIntent('exp1')).toBeNull();
    });

    it('should ignore an expired intent', () => {
      makeCommunity(null);
      const now = Date.now();
      const dateSpy = spyOn(Date, 'now').and.returnValue(now);
      service.saveSignInIntent('exp1');
      dateSpy.and.returnValue(now + POST_SIGN_IN_EXIT_INTENT_TTL_MSEC + 1);

      expect(service.consumeSignInIntent('exp1')).toBeNull();
    });

    it('should ignore corrupted stored data', () => {
      localStorageService.setPostSignInExitIntent('{not json');

      expect(service.consumeSignInIntent('exp1')).toBeNull();
    });

    it('should return null when nothing is stored', () => {
      expect(service.consumeSignInIntent('exp1')).toBeNull();
    });

    it('should clear the stored intent', () => {
      makeCommunity(null);
      service.saveSignInIntent('exp1');

      service.clearSignInIntent();

      expect(localStorageService.getPostSignInExitIntent()).toBeNull();
    });
  });
});
