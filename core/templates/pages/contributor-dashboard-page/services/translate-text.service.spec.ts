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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { TranslateTextService } from 'pages/contributor-dashboard-page/services/translate-text.service';

describe('TranslateTextService', () => {
  let translateTextService;
  let httpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    translateTextService = TestBed.inject(TranslateTextService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getTextToTranslate', () => {
    it('should return all texts per state', fakeAsync(() => {
      let textAndAvailability;
      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: 'text1', contentId2: 'text2'},
        stateName2: {contentId3: 'text3'}
      };
      translateTextService.init('1', 'en', () => {});
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en');
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1
      });
      flushMicrotasks();

      const expectedTextAndAvailability3 = {
        text: 'text3',
        more: false,
        status: 'pending',
        translationHtml: ''
      };

      const expectedTextAndAvailability2 = {
        text: 'text2',
        more: true,
        status: 'pending',
        translationHtml: ''
      };

      const expectedTextAndAvailability1 = {
        text: 'text1',
        more: true,
        status: 'pending',
        translationHtml: ''
      };

      const expectedTextAndPreviousAvailability1 = {
        text: 'text1',
        more: false,
        status: 'pending',
        translationHtml: ''
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

    it('should return no more available for states with no texts',
      fakeAsync(() => {
        const expectedTextAndAvailability = {
          text: 'text1',
          more: false,
          status: 'pending',
          translationHtml: ''
        };
        const sampleStateWiseContentMapping = {
          stateName1: {contentId1: 'text1'},
          stateName2: {contentId2: ''}
        };
        translateTextService.init('1', 'en', () => {});
        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=en');
        expect(req.request.method).toEqual('GET');
        req.flush({
          state_names_to_content_id_mapping: sampleStateWiseContentMapping,
          version: 1
        });
        flushMicrotasks();

        const textAndAvailability = translateTextService.getTextToTranslate();

        expect(textAndAvailability).toEqual(expectedTextAndAvailability);
      }));

    it('should return {null, False} for completely empty states',
      fakeAsync(() => {
        const expectedTextAndAvailability = {
          text: null,
          more: false,
          status: 'pending',
          translationHtml: ''
        };
        const sampleStateWiseContentMapping = {
          stateName1: {contentId1: ''},
          stateName2: {contentId2: ''}
        };
        translateTextService.init('1', 'en', () => {});
        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=en');
        expect(req.request.method).toEqual('GET');
        req.flush({
          state_names_to_content_id_mapping: sampleStateWiseContentMapping,
          version: 1
        });
        flushMicrotasks();

        const textAndAvailability = translateTextService.getTextToTranslate();

        expect(textAndAvailability).toEqual(expectedTextAndAvailability);

        const textAndPreviousAvailability = (
          translateTextService.getPreviousTextToTranslate());

        expect(textAndAvailability).toEqual(textAndPreviousAvailability);
      }));
  });
});
