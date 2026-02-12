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
 * @fileoverview Unit tests for StoryEditorNavigationService.
 */

import {TestBed} from '@angular/core/testing';

import {StoryEditorNavigationService} from 'pages/story-editor-page/services/story-editor-navigation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('Story editor navigation service', () => {
  let windowRef: WindowRef;
  let sens: StoryEditorNavigationService;
  let sampleHash = '/chapter_editor/node_1';
  let pathname = '/chapter_editor';
  let mockLocation: Pick<
    Location,
    'hash' | 'href' | 'origin' | 'pathname' | 'search'
  >;
  let origin = 'http://sample.com';

  beforeEach(() => {
    mockLocation = {
      href: origin + pathname,
      origin: origin,
      pathname: pathname,
      hash: sampleHash,
      search: '',
    };

    windowRef = TestBed.get(WindowRef);
    sens = TestBed.get(StoryEditorNavigationService);
  });

  it('should return the active tab', function () {
    expect(sens.getActiveTab()).toEqual('story_editor');
  });

  it('should set the chapter id', function () {
    sens.setChapterId('node_id_1');
    expect(sens.getChapterId()).toEqual('node_id_1');
  });

  it('should navigate to chapter editor with the given id', function () {
    sens.navigateToChapterEditorWithId('node_id_1', 1);
    expect(sens.getChapterId()).toEqual('node_id_1');
    expect(sens.getChapterIndex()).toEqual(1);
  });

  it('should navigate to story editor', function () {
    sens.navigateToStoryEditor();
    expect(sens.getActiveTab()).toEqual('story_editor');
  });

  it('should return true if current tab is chapter editor tab', function () {
    spyOnProperty(windowRef, 'nativeWindow').and.callFake(
      () =>
        ({
          location: mockLocation as Location,
        }) as Window
    );
    expect(sens.checkIfPresentInChapterEditor()).toEqual(true);

    mockLocation.hash = 'story/';
    expect(sens.checkIfPresentInChapterEditor()).toEqual(false);
    mockLocation.hash = '/chapter_editor/node_1';
  });

  it('should return false if the active tab is not chapter editor tab', function () {
    spyOnProperty(windowRef, 'nativeWindow').and.callFake(
      () =>
        ({
          location: mockLocation as Location,
        }) as Window
    );
    expect(sens.checkIfPresentInChapterEditor()).toEqual(true);

    mockLocation.hash = 'story/';
    expect(sens.checkIfPresentInChapterEditor()).toEqual(false);
    mockLocation.hash = '/chapter_editor/node_1';
  });

  it('should return true if url is in story preview', function () {
    mockLocation.hash = '/story_preview/';
    spyOnProperty(windowRef, 'nativeWindow').and.callFake(
      () =>
        ({
          location: mockLocation as Location,
        }) as Window
    );
    expect(sens.checkIfPresentInStoryPreviewTab()).toEqual(true);

    mockLocation.hash = '/chapter_editor/';
    expect(sens.checkIfPresentInStoryPreviewTab()).toEqual(false);
  });

  it('should navigate to story preview tab', function () {
    sens.navigateToStoryPreviewTab();
    expect(sens.getActiveTab()).toEqual('story_preview');
  });

  it('should navigate to chapter editor', function () {
    sens.navigateToChapterEditor();
    expect(sens.getActiveTab()).toEqual('chapter_editor');
  });
});
