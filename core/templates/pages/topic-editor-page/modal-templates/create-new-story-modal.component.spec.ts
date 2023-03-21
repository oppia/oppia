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
 * @fileoverview Unit tests for Create New Story Modal Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { ImageLocalStorageService, ImagesData } from 'services/image-local-storage.service';
import { CreateNewStoryModalComponent } from './create-new-story-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Create New Story Modal Component', () => {
  let component: CreateNewStoryModalComponent;
  let fixture: ComponentFixture<CreateNewStoryModalComponent>;
  let imageLocalStorageService: ImageLocalStorageService;
  let storyEditorStateService: StoryEditorStateService;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CreateNewStoryModalComponent],
      providers: [
        EditableStoryBackendApiService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewStoryModalComponent);
    component = fixture.componentInstance;
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);

    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{ filename: 'a.png', image: 'faf' } as unknown as ImagesData]);
  });

  it('should check if properties was initialized correctly', () => {
    expect(component.story.title).toBe('');
    expect(component.story.description).toBe('');
    expect(component.MAX_CHARS_IN_STORY_TITLE).toBe(
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
    expect(component.storyUrlFragmentExists).toBeFalse();
    component.story.urlFragment = 'test-url';
    component.onStoryUrlFragmentChange();
    expect(component.storyUrlFragmentExists).toBeTrue();
  });

  it('should not update story url fragment existence for empty url fragment',
    () => {
      spyOn(storyEditorStateService, 'updateExistenceOfStoryUrlFragment');
      component.story.urlFragment = '';
      component.onStoryUrlFragmentChange();
      component.save();
      component.cancel();
      expect(
        storyEditorStateService.updateExistenceOfStoryUrlFragment
      ).not.toHaveBeenCalled();
    });

  it('should check if the story is valid', () => {
    expect(component.isValid()).toBe(false);

    component.story.title = 'title';
    expect(component.isValid()).toBe(false);

    component.story.description = 'description';
    expect(component.isValid()).toBe(false);

    component.story.urlFragment = '';
    expect(component.isValid()).toBe(false);

    component.story.urlFragment = 'ABC 123';
    expect(component.isValid()).toBe(false);

    component.story.urlFragment = 'valid-url';
    expect(component.isValid()).toBe(true);

    component.story.title = '';
    expect(component.isValid()).toBe(false);
  });
});
