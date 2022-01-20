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
 * @fileoverview Unit tests for practiceTab.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StoriesListComponent } from './topic-viewer-stories-list.component';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('stories list component', () => {
  let fixture: ComponentFixture<StoriesListComponent>;
  let component: StoriesListComponent;
  let windowDimensionsService = null;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StoriesListComponent,
        MockTranslatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoriesListComponent);
    component = fixture.componentInstance;
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should check if the view is tablet or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(730);
    expect(component.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);
    expect(component.checkTabletView()).toBe(false);
  });

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toEqual(true);
  });
});
