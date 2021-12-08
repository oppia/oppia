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
 * @fileoverview Unit tests for CreateNewStoryModalComponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateNewStoryModalComponent } from './create-new-story-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { AppConstants } from 'app.constants';

describe('Create New Story Modal Component', function() {
  let componentInstance: CreateNewStoryModalComponent;
  let fixture: ComponentFixture<CreateNewStoryModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let imageLocalStorageService: ImageLocalStorageService;
  let storyEditorStateService: StoryEditorStateService;

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
        NgbActiveModal,
        ImageLocalStorageService,
        TopicEditorStateService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewStoryModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should cancel', () => {
    spyOn(ngbActiveModal, 'dismiss');

    componentInstance.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should validate newly created story', () => {
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

    componentInstance.onStoryUrlFragmentChange('not-empty');

    expect(storyEditorStateService.updateExistenceOfStoryUrlFragment)
      .toHaveBeenCalled();
    expect(storyEditorStateService.getStoryWithUrlFragmentExists)
      .toHaveBeenCalled();
  });

  it('should not update topic url fragment if not provided by user', () => {
    componentInstance.newlyCreatedStory.urlFragment = '';
    spyOn(storyEditorStateService, 'updateExistenceOfStoryUrlFragment');

    componentInstance.onStoryUrlFragmentChange('');

    expect(storyEditorStateService.updateExistenceOfStoryUrlFragment)
      .not.toHaveBeenCalled();
  });

  it('should check if properties was initialized correctly', () => {
    expect(componentInstance.newlyCreatedStory.title).toBe('');
    expect(componentInstance.newlyCreatedStory.description).toBe('');
    expect(componentInstance.MAX_CHARS_IN_STORY_TITLE).toBe(
      AppConstants.MAX_CHARS_IN_STORY_TITLE);
  });

  it('should check if url fragment already exists', () => {
    spyOn(
      storyEditorStateService,
      'updateExistenceOfStoryUrlFragment').and.callFake(
      (urlFragment, callback) => callback());
    spyOn(
      storyEditorStateService,
      'getStoryWithUrlFragmentExists').and.returnValue(true);
    componentInstance.newlyCreatedStory.urlFragment = 'test-url';

    componentInstance.onStoryUrlFragmentChange('test-url');

    expect(componentInstance.storyUrlFragmentExists).toBeFalse();
    expect(componentInstance.storyUrlFragmentExists).toBeTrue();
  });
});
