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
 * @fileoverview Unit tests for the story node editor directive.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PageTitleService } from 'services/page-title.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { StoryNodeEditorComponent } from './story-node-editor.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Story Node Editor Component', () => {
  let fixture: ComponentFixture<StoryNodeEditorComponent>;
  let componentInstance: StoryNodeEditorComponent;
  let pageTitleService: PageTitleService;
  let windowDimensionsService: WindowDimensionsService;
  let focusManagerService: FocusManagerService;

  beforeAll(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoryNodeEditorComponent],
      providers: [
        PageTitleService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryNodeEditorComponent);
    componentInstance = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    focusManagerService = TestBed.inject(FocusManagerService);
  });

  it('should initalize', fakeAsync(() => {
    spyOn(pageTitleService, 'setNavbarTitleForMobileView');
    spyOn(windowDimensionsService, 'isWindowNarrow');
    spyOn(focusManagerService, 'setFocusWithoutScroll');

    componentInstance.ngOnInit();
    tick();

    expect(pageTitleService.setNavbarSubtitleForMobileView).toHaveBeenCalled();
    expect(windowDimensionsService.isWindowNarrow).toHaveBeenCalled();
    expect(focusManagerService.setFocusWithoutScroll).toHaveBeenCalled();
  }));
});
