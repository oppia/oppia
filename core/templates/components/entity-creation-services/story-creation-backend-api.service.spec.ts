// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for Story Creation Service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Topic, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { TopicEditorStateService } from 'pages/topic-editor-page/services/topic-editor-state.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { StoryCreationBackendApiService } from './story-creation-backend-api.service';

describe('Story Creation Backend Api Service', () => {
  let scbas: StoryCreationBackendApiService;
  let topicEditorStateService: TopicEditorStateService;
  let imageLocalStorageService: ImageLocalStorageService;
  let csrfTokenService: CsrfTokenService;
  let imageBlob: Blob;
  let ngbModal: NgbModal;
  let httpTestingController: HttpTestingController;
  let topicObjectFactory: TopicObjectFactory;
  let topic: Topic;
  let mockWindow = {
    location: ''
  };


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        StoryCreationBackendApiService
      ]
    });
  }));

  beforeEach(async(() => {
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    scbas = TestBed.inject(StoryCreationBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    httpTestingController = TestBed.inject(HttpTestingController);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    csrfTokenService = TestBed.inject(CsrfTokenService);

    imageBlob = new Blob(['image data'], {type: 'imagetype'});
    topic = topicObjectFactory.createInterstitialTopic();
    topic.getId = () => {
      return 'id';
    };

    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{
        filename: 'Image1',
        imageBlob: imageBlob
      }]);
    spyOn(imageLocalStorageService, 'getThumbnailBgColor').and.returnValue(
      '#f00');
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(csrfTokenService, 'getTokenAsync')
      .and.returnValue(Promise.resolve('sample-csrf-token'));
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not initiate new story creation if another is in process', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    } as NgbModalRef);

    scbas.createNewCanonicalStory();

    // Creating a new story while previous was in creation process.
    expect(scbas.createNewCanonicalStory()).toBeUndefined();
  });

  it('should post story data to server and change window location' +
    ' on success', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        isValid: () => true,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    } as NgbModalRef);

    expect(mockWindow.location).toBe('');
    scbas.createNewCanonicalStory();

    let req = httpTestingController.expectOne(
      '/topic_editor_story_handler/' + 'id');
    expect(req.request.method).toEqual('POST');
    req.flush({storyId: 'id'});


    flushMicrotasks();

    expect(mockWindow.location).toBe('/story_editor/id');
  }));

  it('should throw error if the newly created story is not valid', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        isValid: () => false,
        title: 'Title',
        description: 'Description',
        urlFragment: 'url'
      })
    } as NgbModalRef);
    try {
      scbas.createNewCanonicalStory();
    } catch (e) {
      expect(e).toBe(new Error('Story fields cannot be empty'));
    }
  });
});
