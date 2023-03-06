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

import { ContributionOpportunitiesService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoggerService } from 'services/contextual/logger.service';
import { TranslationTopicService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { fakeAsync, TestBed } from '@angular/core/testing';


describe('Translation topic service', () => {
  let $flushPendingTasks: () => void;
  let $q = null;

  let loggerService: LoggerService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;

  beforeEach(angular.mock.inject(function($injector) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    $q = $injector.get('$q');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    loggerService = TestBed.get(LoggerService);
    translationTopicService = TestBed.get(TranslationTopicService);
    contributionOpportunitiesService = TestBed.get(
      ContributionOpportunitiesService);
    spyOn(contributionOpportunitiesService, 'getTranslatableTopicNamesAsync')
      .and.returnValue($q.resolve(['Topic 1', 'Topic 2']));
  }));

  describe('Translation topic service', () => {
    it('should correctly set and get topic names', fakeAsync(async() => {
      translationTopicService.setActiveTopicName('Topic 1');
      $flushPendingTasks();
      expect(translationTopicService.getActiveTopicName()).toBe(
        'Topic 1');
    }));

    it('should not allow invalid topic names to be set', () => {
      const logErrorSpy = spyOn(loggerService, 'error').and.callThrough();

      translationTopicService.setActiveTopicName('Topic 3');
      $flushPendingTasks();
      expect(
        translationTopicService.getActiveTopicName()).toBeUndefined();
      expect(logErrorSpy).toHaveBeenCalledWith(
        'Invalid active topic name: Topic 3'
      );

      // This throws "Argument of type 'null' is not assignable to parameter
      // of type 'string'" We need to suppress this error because of the need
      // to test validations. This error is thrown because the topic name is
      // null.
      // @ts-ignore
      translationTopicService.setActiveTopicName(null);
      $flushPendingTasks();
      expect(
        translationTopicService.getActiveTopicName()).toBeUndefined();
    });

    it('should emit the new topic name', () => {
      let newTopicEventEmitter = new EventEmitter();
      expect(translationTopicService.onActiveTopicChanged).toEqual(
        newTopicEventEmitter);
    });
  });
});
