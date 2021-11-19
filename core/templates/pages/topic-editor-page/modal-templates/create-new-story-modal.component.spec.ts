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
 * @fileoverview Unit tests for CreateNewStoryModalController.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateNewStoryModalComponent } from './create-new-story-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { ContextService } from 'services/context.service';
import constants from 'assets/constants';

fdescribe('Create New Story Modal Component', function() {
  let componentInstance: CreateNewStoryModalComponent;
  let fixture: ComponentFixture<CreateNewStoryModalComponent>;
  let contextService: ContextService;
  let ngbActiveModal: NgbActiveModal;
  let imageLocalStorageService: ImageLocalStorageService;
  let storyEditorStateService: StoryEditorStateService;
  let windowRef: WindowRef;

  class MockWindowRef {
    nativeWindow = {
      location: {
        hostname: ''
      }
    };
  }

  class MockActiveModal {
    close(): void {
      return;
    }
  
    dismiss(): void {
      return;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        CreateNewStoryModalComponent,
      ],
      providers: [
        ImageLocalStorageService,
        TopicEditorStateService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewStoryModalComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    windowRef = TestBed.inject(WindowRef);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should check if properties was initialized correctly', function() {
    expect(componentInstance.newlyCreatedStory.title).toBe('');
    expect(componentInstance.newlyCreatedStory.description).toBe('');
    expect(componentInstance.MAX_CHARS_IN_STORY_TITLE).toBe(
      constants.MAX_CHARS_IN_STORY_TITLE);
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
    spyOn(componentInstance.newlyCreatedStory, 'isValid').and.returnValue(true);
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue([{
      filename: '',
      imageBlob: null
    }]);
    expect(componentInstance.isValid()).toBeTrue();
  });

  it('should update topic url fragment', () => {
    componentInstance.newlyCreatedStory.urlFragment = 'not-empty';
    spyOn(storyEditorStateService, 'updateExistenceOfStoryUrlFragment')
      .and.callFake((urlFragment: string, callb: () => void) => {
        callb();
      });
    spyOn(storyEditorStateService, 'getStoryWithUrlFragmentExists')
      .and.returnValue(true);
    componentInstance.onStoryUrlFragmentChange();
    expect(storyEditorStateService.updateExistenceOfStoryUrlFragment)
      .toHaveBeenCalled();
    expect(storyEditorStateService.getStoryWithUrlFragmentExists)
      .toHaveBeenCalled();
  });

  it('should not update topic url fragment if not provided by user',
  () => {
    componentInstance.newlyCreatedStory.urlFragment = '';
    spyOn(storyEditorStateService, 'updateExistenceOfStoryUrlFragment');
    componentInstance.onStoryUrlFragmentChange();
    expect(storyEditorStateService.updateExistenceOfStoryUrlFragment)
      .not.toHaveBeenCalled();
  });

  it('should check if url fragment already exists', () => {
    spyOn(
      storyEditorStateService,
      'updateExistenceOfStoryUrlFragment').and.callFake(
      (urlFragment, callback) => callback());
    spyOn(
      storyEditorStateService,
      'getStoryWithUrlFragmentExists').and.returnValue(true);
    expect(componentInstance.storyUrlFragmentExists).toBeFalse();
    componentInstance.newlyCreatedStory.urlFragment = 'test-url';
    componentInstance.onStoryUrlFragmentChange();
    expect(componentInstance.storyUrlFragmentExists).toBeTrue();
  });
});
