// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation topic service.
 */

import {ContributionOpportunitiesService} from 'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import {ALL_TOPICS_OPTION} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {EventEmitter} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LoggerService} from 'services/contextual/logger.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';

describe('Translation topic service', () => {
  let loggerService: LoggerService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LoggerService,
        TranslationTopicService,
        ContributionOpportunitiesService,
      ],
    });

    loggerService = TestBed.inject(LoggerService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );

    spyOn(
      contributionOpportunitiesService,
      'getTranslatableTopicsAsync'
    ).and.returnValue(
      Promise.resolve([
        ALL_TOPICS_OPTION,
        {id: 'topic_id_1', name: 'Topic 1'},
        {id: 'topic_id_2', name: 'Topic 2'},
      ])
    );
  });

  describe('Translation topic service', () => {
    it('should correctly set and get topic IDs', fakeAsync(() => {
      translationTopicService.setActiveTopicId('topic_id_1');
      tick();
      expect(translationTopicService.getActiveTopicId()).toBe('topic_id_1');
    }));

    it('should allow the "all topics" sentinel to be set', fakeAsync(() => {
      translationTopicService.setActiveTopicId(
        ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
      );
      tick();
      expect(translationTopicService.getActiveTopicId()).toBe(
        ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL
      );
    }));

    it('should emit an event when the active topic changes', fakeAsync(() => {
      const emitSpy = spyOn(
        translationTopicService.onActiveTopicChanged,
        'emit'
      );

      translationTopicService.setActiveTopicId('topic_id_2');
      tick();

      expect(emitSpy).toHaveBeenCalled();
    }));

    it('should not allow invalid topic IDs to be set', fakeAsync(() => {
      const logErrorSpy = spyOn(loggerService, 'error').and.callThrough();
      const emitSpy = spyOn(
        translationTopicService.onActiveTopicChanged,
        'emit'
      );

      translationTopicService.setActiveTopicId('topic_id_3');
      tick();
      expect(translationTopicService.getActiveTopicId()).toBeUndefined();
      expect(logErrorSpy).toHaveBeenCalledWith(
        'Invalid active topic ID: topic_id_3'
      );

      // A topic name is not a valid topic ID.
      translationTopicService.setActiveTopicId('Topic 1');
      tick();
      expect(translationTopicService.getActiveTopicId()).toBeUndefined();
      expect(emitSpy).not.toHaveBeenCalled();
    }));

    it('should expose the active topic changed event emitter', () => {
      const newTopicEventEmitter = new EventEmitter();
      expect(translationTopicService.onActiveTopicChanged).toEqual(
        newTopicEventEmitter
      );
    });
  });
});
