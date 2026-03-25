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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CreateNewTopicModalComponent} from './create-new-topic-modal.component';
import {UrlFragmentEditorComponent} from '../../../components/url-fragment-editor/url-fragment-editor.component';
import {By} from '@angular/platform-browser';

describe('Create new topic modal', () => {
  let fixture: ComponentFixture<CreateNewTopicModalComponent>;
  let componentInstance: CreateNewTopicModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let topicEditorStateService: TopicEditorStateService;

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: '',
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [CreateNewTopicModalComponent, UrlFragmentEditorComponent],
      providers: [
        NgbActiveModal,
        TopicEditorStateService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewTopicModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
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
    componentInstance.thumbnailImage = new Blob(['test'], {
      type: 'image/svg+xml',
    });
    expect(componentInstance.isValid()).toBeTrue();
  });

  it('should update topic url framgent', () => {
    componentInstance.newlyCreatedTopic.urlFragment = 'not-empty';
    spyOn(
      topicEditorStateService,
      'updateExistenceOfTopicUrlFragment'
    ).and.callFake((urlFragment: string, callb: () => void) => {
      callb();
    });
    spyOn(
      topicEditorStateService,
      'getTopicWithUrlFragmentExists'
    ).and.returnValue(true);
    componentInstance.onTopicUrlFragmentChange();
    expect(
      topicEditorStateService.updateExistenceOfTopicUrlFragment
    ).toHaveBeenCalled();
    expect(
      topicEditorStateService.getTopicWithUrlFragmentExists
    ).toHaveBeenCalled();
  });

  it('should not update topic url with wrong framgent', () => {
    componentInstance.newlyCreatedTopic.urlFragment = 'not empty';
    spyOn(
      topicEditorStateService,
      'updateExistenceOfTopicUrlFragment'
    ).and.callFake((urlFragment, successCallback, errorCallback) => {
      errorCallback();
    });
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists');
    componentInstance.onTopicUrlFragmentChange();
    expect(
      topicEditorStateService.updateExistenceOfTopicUrlFragment
    ).toHaveBeenCalled();
    expect(
      topicEditorStateService.getTopicWithUrlFragmentExists
    ).not.toHaveBeenCalled();
  });

  it('should update topic name', () => {
    componentInstance.newlyCreatedTopic.name = 'not-empty';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicName').and.callFake(
      (topicName: string, callb: () => void) => {
        callb();
      }
    );
    spyOn(topicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      true
    );
    componentInstance.onTopicNameChange();
    expect(
      topicEditorStateService.updateExistenceOfTopicName
    ).toHaveBeenCalled();
    expect(topicEditorStateService.getTopicWithNameExists).toHaveBeenCalled();
  });

  it('should not update existence of topic name if not provided by user', () => {
    componentInstance.newlyCreatedTopic.name = '';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicName');
    componentInstance.onTopicNameChange();
    expect(
      topicEditorStateService.updateExistenceOfTopicName
    ).not.toHaveBeenCalled();
  });

  it('should remove unnecessary spaces from topic name', () => {
    componentInstance.newlyCreatedTopic.name = ' extra  spaces ';
    componentInstance.onTopicNameChange();
    expect(componentInstance.newlyCreatedTopic.name).toBe('extra spaces');
  });

  it('should not update topic url fragment if not provided by user', () => {
    componentInstance.newlyCreatedTopic.urlFragment = '';
    spyOn(topicEditorStateService, 'updateExistenceOfTopicUrlFragment');
    componentInstance.onTopicUrlFragmentChange();
    expect(
      topicEditorStateService.updateExistenceOfTopicUrlFragment
    ).not.toHaveBeenCalled();
  });

  it('should call onUrlFragmentChange when urlFragmentChange event is emitted', () => {
    spyOn(componentInstance, 'onUrlFragmentChange');
    const childComponent = fixture.debugElement.query(
      By.directive(UrlFragmentEditorComponent)
    );
    const testFragment = 'test-topic-url-fragment';
    childComponent.triggerEventHandler('urlFragmentChange', testFragment);
    expect(componentInstance.onUrlFragmentChange).toHaveBeenCalledWith(
      testFragment
    );
  });

  it('should update newlyCreatedTopic.urlFragment and call onTopicUrlFragmentChange', () => {
    spyOn(componentInstance, 'onTopicUrlFragmentChange');
    const newUrlFragment = 'new-topic-url-fragment';
    componentInstance.onUrlFragmentChange(newUrlFragment);
    expect(componentInstance.newlyCreatedTopic.urlFragment).toBe(
      newUrlFragment
    );
    expect(componentInstance.onTopicUrlFragmentChange).toHaveBeenCalled();
  });

  it('should update thumbnail data on onImageSave', () => {
    const mockImageData = {
      filename: 'test-thumbnail.svg',
      bg_color: '#FF5733',
      image_data: new Blob(['<svg></svg>'], {type: 'image/svg+xml'}),
    };

    componentInstance.onImageSave(mockImageData);

    expect(componentInstance.thumbnailImage).toBe(mockImageData.image_data);
    expect(componentInstance.thumbnailFilename).toBe(mockImageData.filename);
    expect(componentInstance.thumbnailBgColor).toBe(mockImageData.bg_color);
  });

  it('should update isValid when thumbnail image is set', () => {
    expect(componentInstance.isValid()).toBeFalse();

    componentInstance.thumbnailImage = new Blob(['test'], {type: 'image/svg+xml'});

    expect(componentInstance.isValid()).toBeTrue();
  });
});
