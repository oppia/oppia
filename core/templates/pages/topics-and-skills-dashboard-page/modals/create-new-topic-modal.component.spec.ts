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
 * @fileoverview Unit Test for create new topic modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicEditorStateService } from 'pages/topic-editor-page/services/topic-editor-state.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { CreateNewTopicModalComponent } from './create-new-topic-modal.component';

describe('Create new topic modal', () => {
  let fixture: ComponentFixture<CreateNewTopicModalComponent>;
  let componentInstance: CreateNewTopicModalComponent;
  let contextService: ContextService;
  let ngbActiveModal: NgbActiveModal;
  let imageLocalStorageService: ImageLocalStorageService;
  let topicEditorStateService: TopicEditorStateService;

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: ''
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        CreateNewTopicModalComponent,
      ],
      providers: [
        NgbActiveModal,
        ImageLocalStorageService,
        TopicEditorStateService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewTopicModalComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', () => {
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    componentInstance.ngOnInit();
    expect(contextService.setImageSaveDestinationToLocalStorage)
      .toHaveBeenCalled();
  });

  it('should save new topic', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.save();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should cancel', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should validate newly created topic', () => {
    spyOn(componentInstance.newlyCreatedTopic, 'isValid').and.returnValue(true);
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([{
      filename: '',
      imageBlob: null
    }]);
    expect(componentInstance.isValid()).toBeTrue();
  });

  it('should update topic url framgent', () => {
    componentInstance.newlyCreatedTopic.urlFragment = 'not-empty';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicUrlFragment')
      .and.callFake((urlFragment: string, callb: () => void) => {
        callb();
      });
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists')
      .and.returnValue(true);
    componentInstance.onTopicUrlFragmentChange();
    expect(topicEditorStateService.updateExistenceOfTopicUrlFragment)
      .toHaveBeenCalled();
    expect(topicEditorStateService.getTopicWithUrlFragmentExists)
      .toHaveBeenCalled();
  });

  it('should not update topic url with wrong framgent', () => {
    componentInstance.newlyCreatedTopic.urlFragment = 'not empty';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicUrlFragment')
      .and.callFake((urlFragment, successCallback, errorCallback) => {
        errorCallback();
      });
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists');
    componentInstance.onTopicUrlFragmentChange();
    expect(topicEditorStateService.updateExistenceOfTopicUrlFragment)
      .toHaveBeenCalled();
    expect(topicEditorStateService.getTopicWithUrlFragmentExists)
      .not.toHaveBeenCalled();
  });

  it('should update topic name', () => {
    componentInstance.newlyCreatedTopic.name = 'not-empty';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicName')
      .and.callFake((topicName: string, callb: () => void) => {
        callb();
      });
    spyOn(topicEditorStateService, 'getTopicWithNameExists')
      .and.returnValue(true);
    componentInstance.onTopicNameChange();
    expect(topicEditorStateService.updateExistenceOfTopicName)
      .toHaveBeenCalled();
    expect(topicEditorStateService.getTopicWithNameExists).toHaveBeenCalled();
  });

  it('should not update existence of topic name if not provided by user',
    () => {
      componentInstance.newlyCreatedTopic.name = '';
      spyOn(topicEditorStateService, 'updateExistenceOfTopicName');
      componentInstance.onTopicNameChange();
      expect(topicEditorStateService.updateExistenceOfTopicName)
        .not.toHaveBeenCalled();
    });

  it('should remove unnecessary spaces from topic name',
    () => {
      componentInstance.newlyCreatedTopic.name = ' extra  spaces ';
      componentInstance.onTopicNameChange();
      expect(componentInstance.newlyCreatedTopic.name).toBe('extra spaces');
    });

  it('should not update topic url fragment if not provided by user',
    () => {
      componentInstance.newlyCreatedTopic.urlFragment = '';
      spyOn(topicEditorStateService, 'updateExistenceOfTopicUrlFragment');
      componentInstance.onTopicUrlFragmentChange();
      expect(topicEditorStateService.updateExistenceOfTopicUrlFragment)
        .not.toHaveBeenCalled();
    });
});
