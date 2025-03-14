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
      'getTranslatableTopicNamesAsync'
    ).and.returnValue(Promise.resolve(['Topic 1', 'Topic 2']));
  });

  describe('Translation topic service', () => {
    it('should correctly set and get topic names', fakeAsync(() => {
      translationTopicService.setActiveTopicName('Topic 1');
      tick();
      expect(translationTopicService.getActiveTopicName()).toBe('Topic 1');
    }));

    it('should not allow invalid topic names to be set', fakeAsync(() => {
      const logErrorSpy = spyOn(loggerService, 'error').and.callThrough();

      translationTopicService.setActiveTopicName('Topic 3');
      tick();
      expect(translationTopicService.getActiveTopicName()).toBeUndefined();
      expect(logErrorSpy).toHaveBeenCalledWith(
        'Invalid active topic name: Topic 3'
      );

      translationTopicService.setActiveTopicName(null);
      tick();
      expect(translationTopicService.getActiveTopicName()).toBeUndefined();
    }));

    it('should emit the new topic name', () => {
      const newTopicEventEmitter = new EventEmitter();
      expect(translationTopicService.onActiveTopicChanged).toEqual(
        newTopicEventEmitter
      );
    });
  });
});
