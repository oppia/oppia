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
import {TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING} from 'domain/exploration/written-translation.model';

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
        text: '',
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

    it('should return empty translation for set data format', fakeAsync(() => {
      const sampleStateWiseContentMapping = {
        stateName1: {
          contentId1: {
            content_format: TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
            content_value: ['a', 'b'],
            content_type: 'rule',
            interaction_id: 'TextInput',
            rule_type: 'Equals',
          },
        },
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

      expect(textAndAvailability.translation).toEqual([]);
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

  describe('suggestTranslatedText', () => {
    it('should not submit when active content is unavailable', () => {
      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');

      translateTextService.suggestTranslatedText(
        'translated text',
        'hi',
        [],
        'html',
        successCallback,
        errorCallback
      );

      httpTestingController.expectNone('/suggestionhandler/');
      expect(successCallback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should not submit when content is missing for active ids', () => {
      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');

      translateTextService.activeExpId = 'exp1';
      translateTextService.activeExpVersion = '1';
      translateTextService.activeStateName = 'state1';
      translateTextService.activeContentId = 'content1';
      translateTextService.stateWiseContents = {state1: {}};

      translateTextService.suggestTranslatedText(
        'translated text',
        'hi',
        [],
        'html',
        successCallback,
        errorCallback
      );

      httpTestingController.expectNone('/suggestionhandler/');
      expect(successCallback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should update status and translation on successful submission', fakeAsync(() => {
      const sampleStateWiseContentMapping = {
        stateName1: {
          contentId1: getTranslatableItem('text1'),
        },
      };

      translateTextService.init('1', 'en', () => {});
      let req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();

      translateTextService.getTextToTranslate();

      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');
      translateTextService.suggestTranslatedText(
        'translated text',
        'hi',
        [],
        'html',
        successCallback,
        errorCallback
      );
      flushMicrotasks();

      req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      req.flush({});
      flushMicrotasks();

      expect(translateTextService.stateAndContent[0].status).toBe('submitted');
      expect(translateTextService.stateAndContent[0].translation).toBe(
        'translated text'
      );
      expect(successCallback).toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    }));

    it('should not throw when active translation item is reset before api success response', fakeAsync(() => {
      const sampleStateWiseContentMapping = {
        stateName1: {
          contentId1: getTranslatableItem('text1'),
        },
      };

      translateTextService.init('1', 'en', () => {});
      let req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();

      translateTextService.getTextToTranslate();

      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');
      translateTextService.suggestTranslatedText(
        'translated text',
        'hi',
        [],
        'html',
        successCallback,
        errorCallback
      );
      flushMicrotasks();

      req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');

      // Simulate state reset before the pending submission callback resolves.
      translateTextService.activeIndex = -1;
      translateTextService.stateAndContent = [];
      translateTextService.activeStateName = '';
      translateTextService.activeContentId = null;

      req.flush({});
      flushMicrotasks();

      expect(successCallback).toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    }));
  });
});
