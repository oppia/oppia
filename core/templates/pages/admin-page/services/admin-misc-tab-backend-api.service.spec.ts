// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminMiscTabBackendApiService.
 */


import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { AdminMiscTabBackendApiService } from
'pages/admin-page/services/admin-misc-tab-backend-api.service';

describe('Admin Misc Tab Backend API service', () => {
    let adminMiscTabBackendApiService: AdminMiscTabBackendApiService;
    let httpTestingController: HttpTestingController;
    let csrfService: CsrfTokenService = null;
    let successHandler = null;
    let failHandler = null;
  
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AdminMiscTabBackendApiService]
      });
      httpTestingController = TestBed.get(HttpTestingController);
      adminMiscTabBackendApiService = TestBed.get(
        AdminMiscTabBackendApiService
      );
      csrfService = TestBed.get(CsrfTokenService);
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('fail');
  
      spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
        return Promise.resolve('sample-csrf-token');
      });
    });
  
    afterEach(() => {
      httpTestingController.verify();
    });
    
    it('should flush the memory cache',
      fakeAsync(() => {
        adminMiscTabBackendApiService.flushCache()
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/memorycacheadminhandler');
        expect(req.request.method).toEqual('POST');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));
  
    it('should clear search index',
      fakeAsync(() => {
        adminMiscTabBackendApiService.clearSearchIndex()
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/adminhandler');
        expect(req.request.method).toEqual('POST');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));

      it('should not regenerate topic related oppurtunities if id is incorrect',
      fakeAsync(() => {
        let topicId = 'topic_1';
        let errorMessage='Server error: Entity for class TopicModel with id '
          + topicId +' not found'
        adminMiscTabBackendApiService.regenerateTopicRelatedOpportunities(
          topicId
        ).then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/adminhandler');
        expect(req.request.method).toEqual('POST');
        req.flush(
          { error: errorMessage },
          { status: 500, statusText: ''}
        );
        flushMicrotasks();
  
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
        console.log(failHandler)
      }
      ));
      
      it('should upload topic similarities',
      fakeAsync(() => {
        let data = 'topic_similarities.csv';
        adminMiscTabBackendApiService.uploadTopicSimilarities(data)
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/adminhandler');
        expect(req.request.method).toEqual('POST');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));
      
      it('should send dummy mail to admin',
      fakeAsync(() => {
        let errorMessage='Server error: This app cannot send emails.'
        adminMiscTabBackendApiService.sendDummyMail()
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/senddummymailtoadminhandler');
        expect(req.request.method).toEqual('POST');
        req.flush(
          { error: errorMessage },
          { status: 400, statusText: ''}
        );
        flushMicrotasks();
  
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      }
      ));

      it('should get data of memory cache profile',
      fakeAsync(() => {
        adminMiscTabBackendApiService.getMemoryCacheProfile()
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/memorycacheadminhandler');
        expect(req.request.method).toEqual('GET');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));

      it('should update the username of oppia account',
      fakeAsync(() => {
        let oldUsername = 'old name'
        let newUsername = 'new name'
        adminMiscTabBackendApiService.updateUserName(oldUsername,newUsername)
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/updateusernamehandler');
        expect(req.request.method).toEqual('PUT');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));
      
      it('should get the data of number of pending delete requests',
      fakeAsync(() => {
        adminMiscTabBackendApiService.numberOfPendingDeletionRequest()
          .then(successHandler, failHandler);
  
        let req = httpTestingController.expectOne(
          '/numberofdeletionrequestshandler');
        expect(req.request.method).toEqual('GET');
        req.flush(200);
        flushMicrotasks();
  
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      }
      ));
  });