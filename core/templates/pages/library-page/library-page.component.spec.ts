// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the component of the library page.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SearchService } from 'services/search.service';
import { UserService } from 'services/user.service';
import { MockTranslateModule } from 'tests/unit-test-utils';
import { LibraryPageComponent } from './library-page.component';
import { LibraryPageBackendApiService } from './services/library-page-backend-api.service';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Library Page Component', () => {
  let fixture: ComponentFixture<LibraryPageComponent>;
  let componentInstance: LibraryPageComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MockTranslateModule
      ],
      declarations: [
        LibraryPageComponent
      ],
      providers: [
        LoggerService,
        WindowRef,
        I18nLanguageCodeService,
        KeyboardShortcutService,
        LibraryPageBackendApiService,
        LoaderService,
        SearchService,
        UrlInterpolationService,
        UserService,
        WindowDimensionsService,
        ClassroomBackendApiService,
        PageTitleService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryPageComponent);
    componentInstance = fixture.componentInstance;
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should set active group', () => {
    let groupIndex = 20;
    componentInstance.setActiveGroup(groupIndex);
    expect(componentInstance.activeGroupIndex).toEqual(groupIndex);
  });

  it('should clear active group', () => {
    componentInstance.setActiveGroup(10);
    componentInstance.clearActiveGroup();
    expect(componentInstance.activeGroupIndex).toBeNull();
  });

  it('should intialize carousels', () => {
    componentInstance.libraryGroups = [{
      activity_summary_dicts: [],
      categories: [],
      header_i18n_id: '',
      has_full_results_page: true,
      full_results_url: '',
      protractor_id: ''
    }];
    componentInstance.initCarousels();
    expect(componentInstance.leftmostCardIndices.length).toEqual(1);
  });

  it('should not initialize carousels if there are no library groups',
    () => {
      componentInstance.initCarousels();
      expect(componentInstance.leftmostCardIndices.length).toEqual(0);
    });

  it('should scroll carousel', () => {
    componentInstance.libraryGroups = [];
    let activityDicts = [];

    for (let i = 0; i < 5; i++) {
      activityDicts.push({
        activity_type: '',
        category: '',
        community_owned: true,
        id: '',
        language_code: '',
        num_views: 10,
        objective: '',
        status: '',
        tags: [],
        thumbnail_bg_color: '',
        thumbnail_icon_url: '',
        title: ''
      });
    }

    for (let i = 0; i < 10; i++) {
      componentInstance.libraryGroups.push({
        activity_summary_dicts: activityDicts,
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: ''
      });
    }
    componentInstance.scroll(3, false);
    componentInstance.scroll(3, true);
  });

  it('should not scroll if other carousel is currently scrolling', () => {
    componentInstance.isAnyCarouselCurrentlyScrolling = true;
    componentInstance.scroll(0, true);
  });

  it('should not scroll if all tiles are already showing', () => {
    componentInstance.libraryGroups = [];
    let activityDicts = [];

    for (let i = 0; i < 3; i++) {
      activityDicts.push({
        activity_type: '',
        category: '',
        community_owned: true,
        id: '',
        language_code: '',
        num_views: 10,
        objective: '',
        status: '',
        tags: [],
        thumbnail_bg_color: '',
        thumbnail_icon_url: '',
        title: ''
      });
    }

    for (let i = 0; i < 2; i++) {
      componentInstance.libraryGroups.push({
        activity_summary_dicts: activityDicts,
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: ''
      });
    }

    componentInstance.tileDisplayCount = 5;
    componentInstance.scroll(1, false);
  });
});
