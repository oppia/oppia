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
 * @fileoverview Unit tests for TopicEditorRoutingService.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageTitleService} from 'services/page-title.service';
import {TopicEditorRoutingService} from './topic-editor-routing.service';

describe('Topic Editor Routing Service', () => {
  let ters: TopicEditorRoutingService;
  let mockWindowRef: MockWindowRef;

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
      },
      open: (url: string) => {},
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        PageTitleService,
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    ters = TestBed.inject(TopicEditorRoutingService);
    mockWindowRef = TestBed.inject(WindowRef) as MockWindowRef;
  });

  it('should return the default active tab name', () => {
    expect(ters.getActiveTabName()).toEqual('main');
  });

  it('should navigate to different tabs', function () {
    expect(ters.getActiveTabName()).toEqual('main');
    ters.navigateToSubtopicEditorWithId(1);
    expect(ters.getActiveTabName()).toEqual('subtopic_editor');
    ters.navigateToQuestionsTab();
    expect(ters.getActiveTabName()).toEqual('questions');
    ters.navigateToMainTab();
    expect(ters.getActiveTabName()).toEqual('main');
    ters.navigateToTopicPreviewTab();
    expect(ters.getActiveTabName()).toEqual('topic_preview');
    ters.navigateToSubtopicPreviewTab(1);
    expect(ters.getActiveTabName()).toEqual('subtopic_preview');
  });

  it('should handle calls with unexpect paths', () => {
    expect(ters.getActiveTabName()).toEqual('main');

    mockWindowRef.nativeWindow.location.hash = '';
    expect(ters.getActiveTabName()).toEqual('main');
  });

  it('should navigate to skill editor', function () {
    spyOn(mockWindowRef.nativeWindow, 'open');
    ters.navigateToSkillEditorWithId('10');
    expect(mockWindowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/skill_editor/10'
    );
  });

  it('should return last tab visited', () => {
    ters.navigateToSubtopicEditorWithId(1);
    expect(ters.getLastTabVisited()).toEqual('subtopic');
    ters.navigateToMainTab();
    expect(ters.getLastTabVisited()).toEqual('topic');
  });

  it('should return last visited subtopic id', () => {
    ters.updateViewEventEmitter.emit();

    ters.navigateToSubtopicPreviewTab(1);
    ters.navigateToQuestionsTab();
    expect(ters.getLastSubtopicIdVisited()).toEqual(1);

    ters.navigateToSubtopicPreviewTab(5);
    ters.navigateToQuestionsTab();
    expect(ters.getLastSubtopicIdVisited()).toEqual(5);
  });
});
