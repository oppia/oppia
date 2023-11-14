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
 * @fileoverview Unit tests for storyViewerPageRoot.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { StoryViewerPageRootComponent } from './story-viewer-page-root.component';

describe('Story Viewer Page Root component', () => {
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let fixture: ComponentFixture<StoryViewerPageRootComponent>;
  let component: StoryViewerPageRootComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoryViewerPageRootComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StoryViewerPageRootComponent);
    component = fixture.componentInstance;
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });
});
