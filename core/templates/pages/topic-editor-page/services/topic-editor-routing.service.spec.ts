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
import { SpyLocation } from '@angular/common/testing';
import { Location } from '@angular/common';
import { TestBed, tick, fakeAsync } from '@angular/core/testing';
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.

import { TopicEditorRoutingService } from 'pages/topic-editor-page/services/topic-editor-routing.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Topic editor routing service', () => {
  let ters: TopicEditorRoutingService;
  let locat: SpyLocation;
  let openspy = jasmine.createSpy('open');

  class MockWindowRef {
    _window = {
      open: openspy
    };
    get nativeWindow() {
      return this._window;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TopicEditorRoutingService,
        {provide: Location, useClass: SpyLocation},
        {provide: WindowRef, useClass: MockWindowRef}
      ]
    });
    ters = TestBed.get(TopicEditorRoutingService);
    locat = TestBed.get(Location);
    ters.inSpecMode = true;
  });

  it('should return the default active tab name', () => {
    expect(ters.getActiveTabName()).toEqual('main');
  });

  it('should navigate to different tabs', fakeAsync(() => {
    expect(ters.getActiveTabName()).toEqual('main');

    ters.navigateToSubtopicPreviewTab(1);
    tick(20);
    expect(ters.getActiveTabName()).toEqual('subtopic_preview');
    ters.navigateToSubtopicEditorWithId(1);
    tick(20);
    expect(ters.getActiveTabName()).toEqual('subtopic_editor');

    ters.navigateToQuestionsTab();
    tick(20);
    expect(ters.getActiveTabName()).toEqual('questions');

    ters.navigateToMainTab();
    tick(20);
    expect(ters.getActiveTabName()).toEqual('main');

    ters.navigateToTopicPreviewTab();
    tick(20);
    expect(ters.getActiveTabName()).toEqual('topic_preview');
  }));

  it('should handle calls with unexpect paths', () => {
    expect(ters.getActiveTabName()).toEqual('main');

    locat.go('/');
    expect(ters.getActiveTabName()).toEqual('main');

    locat.go('');
    expect(ters.getActiveTabName()).toEqual('main');
  });

  it('should navigate to skill editor', () => {
    ters.navigateToSkillEditorWithId('10');
    expect(openspy).toHaveBeenCalled();
    expect(openspy).toHaveBeenCalledWith('/skill_editor/10');
  });

  it('should return last tab visited', () => {
    ters.navigateToSubtopicEditorWithId(1);
    expect(ters.getLastTabVisited()).toEqual('subtopic');

    ters.navigateToMainTab();
    expect(ters.getLastTabVisited()).toEqual('topic');
  });

  it('should return last visited subtopic id', () => {
    ters.navigateToSubtopicPreviewTab(1);

    ters.navigateToQuestionsTab();
    expect(ters.getLastSubtopicIdVisited()).toEqual(1);

    ters.navigateToSubtopicPreviewTab(5);

    ters.navigateToQuestionsTab();
    expect(ters.getLastSubtopicIdVisited()).toEqual(5);
  });
});
