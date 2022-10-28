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
 * @fileoverview Unit tests for the checkpoint celebration utility service.
 */

 import { TestBed } from '@angular/core/testing';
 import { EventEmitter } from '@angular/core';
 import { TranslateService } from '@ngx-translate/core';
 import { MisspelledAnswerResponseUtilityService } from './misspelled-answer-response-utility.service';
 
 class MockTranslateService {
   onLangChange: EventEmitter<string> = new EventEmitter();
   instant(key: string, interpolateParams: Object | undefined): string {
     return key;
   }
 }
 
 describe('Misspelled answer response utility service', () => {
   let misspelledAnswerResponseUtilityService: MisspelledAnswerResponseUtilityService;
   let translateService: TranslateService;
 
   beforeEach(() => {
     TestBed.configureTestingModule({
       providers: [
         MisspelledAnswerResponseUtilityService,
         {
           provide: TranslateService,
           useClass: MockTranslateService
         }
       ]
     });
   });
 
   beforeEach(() => {
     misspelledAnswerResponseUtilityService = TestBed.inject(
       MisspelledAnswerResponseUtilityService);
     translateService = TestBed.inject(TranslateService);
   });
 
   it('should get the right kind of message i18n key', () => {
     spyOn(Math, 'random').and.returnValue(0.45);
 
     expect(
        misspelledAnswerResponseUtilityService.getFeedbackHtmlWhenAnswerMisspelled())
       .toEqual('I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_1');
   });
 });
 