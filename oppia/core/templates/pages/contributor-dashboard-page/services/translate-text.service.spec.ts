// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for translate-text service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  StateAndContent,
  TranslateTextService,
} from 'pages/contributor-dashboard-page/services/translate-text.service';

describe('TranslateTextService', () => {
  let translateTextService: TranslateTextService;
  let stateContent: StateAndContent;
  let httpTestingController: HttpTestingController;
  const getTranslatableItem = (text: string) => {
    return {
      content_format: 'html',
      content_value: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null,
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    translateTextService = TestBed.inject(TranslateTextService);
    stateContent = new StateAndContent(
      'stateName',
      'contentId',
      'contentText',
      'pending',
      'translation',
      'html',
      'content'
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getTextToTranslate', () => {
    it('should return all texts per state', fakeAsync(() => {
      let textAndAvailability;
      const sampleStateWiseContentMapping = {
        stateName1: {
          contentId1: getTranslatableItem('text1'),
          contentId2: getTranslatableItem('text2'),
        },
        stateName2: {contentId3: getTranslatableItem('text3')},
      };
      translateTextService.init('1', 'en', () => {});
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();

      const expectedTextAndAvailability3 = {
        text: 'text3',
        more: false,
        status: 'pending',
        translation: '',
        dataFormat: 'html',
        contentType: 'content',
        interactionId: null,
        ruleType: null,
      };

      const expectedTextAndAvailability2 = {
        text: 'text2',
        more: true,
        status: 'pending',
        translation: '',
        dataFormat: 'html',
        contentType: 'content',
        interactionId: null,
        ruleType: null,
      };

      const expectedTextAndAvailability1 = {
        text: 'text1',
        more: true,
        status: 'pending',
        translation: '',
        dataFormat: 'html',
        contentType: 'content',
        interactionId: null,
        ruleType: null,
      };

      const expectedTextAndPreviousAvailability1 = {
        text: 'text1',
        more: false,
        status: 'pending',
        translation: '',
        dataFormat: 'html',
        contentType: 'content',
        interactionId: null,
        ruleType: null,
      };

      textAndAvailability = translateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability1);
      textAndAvailability = translateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = translateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability3);

      textAndAvailability = translateTextService.getPreviousTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = translateTextService.getPreviousTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndPreviousAvailability1);

      textAndAvailability = translateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = translateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability3);
    }));

    it('should return no more available for states with no texts', fakeAsync(() => {
      const expectedTextAndAvailability = {
        text: 'text1',
        more: false,
        status: 'pending',
        translation: '',
        dataFormat: 'html',
        contentType: 'content',
        interactionId: null,
        ruleType: null,
      };
      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getTranslatableItem('text1')},
        stateName2: {contentId2: getTranslatableItem('')},
      };
      translateTextService.init('1', 'en', () => {});
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();

      const textAndAvailability = translateTextService.getTextToTranslate();

      expect(textAndAvailability).toEqual(expectedTextAndAvailability);
    }));

    it('should return no text or metadata for completely empty states', fakeAsync(() => {
      const expectedTextAndAvailability = {
        text: null,
        more: false,
        status: 'pending',
        translation: '',
        dataFormat: undefined,
        contentType: undefined,
        interactionId: undefined,
        ruleType: undefined,
      };
      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getTranslatableItem('')},
        stateName2: {contentId2: getTranslatableItem('')},
      };
      translateTextService.init('1', 'en', () => {});
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();

      const textAndAvailability = translateTextService.getTextToTranslate();

      expect(textAndAvailability).toEqual(expectedTextAndAvailability);

      const textAndPreviousAvailability =
        translateTextService.getPreviousTextToTranslate();

      expect(textAndAvailability).toEqual(textAndPreviousAvailability);
    }));
  });

  // Testing setters and getters of StateAndContent class.
  it('should update state name', () => {
    expect(stateContent.stateName).toBe('stateName');
    stateContent.stateName = 'newStateName';
    expect(stateContent.stateName).toBe('newStateName');
  });

  it('should update content id', () => {
    expect(stateContent.contentID).toBe('contentId');
    stateContent.contentID = 'newContentId';
    expect(stateContent.contentID).toBe('newContentId');
  });

  it('should update content text', () => {
    expect(stateContent.contentText).toBe('contentText');
    stateContent.contentText = 'newContentText';
    expect(stateContent.contentText).toBe('newContentText');
  });

  it('should update state and content status', () => {
    expect(stateContent.status).toBe('pending');
    stateContent.status = 'submitted';
    expect(stateContent.status).toBe('submitted');
  });

  it('should update translation html', () => {
    expect(stateContent.translation).toBe('translation');
    stateContent.translation = 'newTranslation';
    expect(stateContent.translation).toBe('newTranslation');
  });
});
