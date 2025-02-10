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
 * @fileoverview Unit tests for SubtopicSummaryTileComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {Subtopic} from 'domain/topic/subtopic.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SubtopicSummaryTileComponent} from './subtopic-summary-tile.component';

class MockWindowRef {
  nativeWindow = {
    open: (url: string) => {},
  };
}

describe('SubtopicSummaryTileComponent', () => {
  let component: SubtopicSummaryTileComponent;
  let fixture: ComponentFixture<SubtopicSummaryTileComponent>;
  let abas: AssetsBackendApiService;
  let windowRef: WindowRef;
  let urlInterpolationService: UrlInterpolationService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SubtopicSummaryTileComponent, MockTranslatePipe],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicSummaryTileComponent);
    component = fixture.componentInstance;
    abas = TestBed.inject(AssetsBackendApiService);
    windowRef = TestBed.inject(WindowRef);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    component.subtopic = Subtopic.create(
      {
        id: 1,
        title: 'Title',
        skill_ids: ['skill_1'],
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a11f40',
        url_fragment: 'title',
      },
      {
        skill_1: 'Description 1',
      }
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
  });

  it('should set component properties on initialization', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue('/thumbnail/url');
    spyOn(i18nLanguageCodeService, 'getSubtopicTranslationKey').and.returnValue(
      'I18N_SUBTOPIC_123abcd_title_TITLE'
    );

    component.ngOnInit();

    expect(component.subtopicTitle).toBe('Title');
    expect(component.thumbnailUrl).toBe('/thumbnail/url');
    expect(component.subtopicTitleTranslationKey).toBe(
      'I18N_SUBTOPIC_123abcd_title_TITLE'
    );
  });

  it('should check if subtopic translation is displayed correctly', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue('/thumbnail/url');
    spyOn(i18nLanguageCodeService, 'getSubtopicTranslationKey').and.returnValue(
      'I18N_SUBTOPIC_123abcd_test_TITLE'
    );
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      false
    );
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(true);

    component.ngOnInit();

    expect(component.subtopicTitleTranslationKey).toBe(
      'I18N_SUBTOPIC_123abcd_test_TITLE'
    );
    let hackySubtopicTitleTranslationIsDisplayed =
      component.isHackySubtopicTitleTranslationDisplayed();
    expect(hackySubtopicTitleTranslationIsDisplayed).toBe(true);
  });

  it('should throw error if subtopic url is null', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue('/thumbnail/url');
    spyOn(i18nLanguageCodeService, 'getSubtopicTranslationKey').and.returnValue(
      'I18N_SUBTOPIC_123abcd_title_TITLE'
    );
    component.subtopic = Subtopic.createFromTitle(1, 'Title');

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Expected subtopic to have a URL fragment');
  });

  it(
    'should not open subtopic page if classroom or topic url' +
      ' does not exist',
    () => {
      component.subtopic = Subtopic.createFromTitle(1, 'Title');
      expect(component.openSubtopicPage()).toBe(undefined);
    }
  );

  it('should open subtopic page when user clicks on subtopic card', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('/url');
    spyOn(windowRef.nativeWindow, 'open');

    component.openSubtopicPage();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith('/url', '_self');
  });
});
