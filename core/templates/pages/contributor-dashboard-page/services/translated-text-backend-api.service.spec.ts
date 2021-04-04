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
 * @fileoverview Tests for translated-text-backend-api service.
 */
 import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
 import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TranslatedTextBackendApiService } from './translated-text-backend-api.service';
  fdescribe('Translated Text Backend Api Service', () => {
    let translateTextBackendApiService: TranslatedTextBackendApiService;
    let httpTestingController: HttpTestingController;
    const expId = '12345';
    const lang_code = 'hi';
    const sampleDataResults = {
        translations_list : ['<p>Translation 1</p>', '<p>Translation 2</p>'],
        content_list : ['<p>Content 1</p>', '<p>Content 2</p>']
    }
    beforeEach(()=>{
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TranslatedTextBackendApiService]
        })
        translateTextBackendApiService = 
            TestBed.inject(TranslatedTextBackendApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    })
    afterEach(() => {
        httpTestingController.verify();
    }); 
    it('should successfully fetch the translations from backend', 
        fakeAsync(() => {
            let successHandler = jasmine.createSpy('success');
            let failHandler = jasmine.createSpy('fail'); 

            let requestUrl = '/getcompletedtranslationshandler?exp_id=12345&language_code=hi'
            translateTextBackendApiService.getTranslationsAndContent(
               expId , lang_code)
               .then(successHandler, failHandler);
            let req = httpTestingController.expectOne(
                requestUrl);
            expect(req.request.method).toEqual('GET');
            req.flush(sampleDataResults);
            
            flushMicrotasks();
            expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
            expect(failHandler).not.toHaveBeenCalledWith();
        })
    )

    it('should use the rejection handler if the backend request fails', 
        fakeAsync(() => {
            let successHandler = jasmine.createSpy('success');
            let failHandler = jasmine.createSpy('fail'); 

            let requestUrl = '/getcompletedtranslationshandler?exp_id=12345&language_code=hi'
            translateTextBackendApiService.getTranslationsAndContent(
               expId , lang_code)
               .then(successHandler, failHandler);
            let req = httpTestingController.expectOne(
                requestUrl);
            expect(req.request.method).toEqual('GET');
            req.flush({
                error: 'Error loading the data'}, {
                status: 500,
                statusText: 'Error loading Translations'
                });
            
            flushMicrotasks();
            expect(successHandler).not.toHaveBeenCalledWith();

            expect(failHandler).toHaveBeenCalledWith({
                error: 'Error loading the data'});
        })
    )
 })
