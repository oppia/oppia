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
 * @fileoverview Unit tests for the about page.
 */

import { ComponentFixture, TestBed} from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA, Pipe }
  from '@angular/core';
import { HttpClientTestingModule } from
  '@angular/common/http/testing';

import { AboutPageComponent } from './about-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateService } from 'services/translate.service';
import { UtilsService } from 'services/utils.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}

class MockTranslateService {
  languageCode = 'es';
  use(newLanguageCode: string): string {
    this.languageCode = newLanguageCode;
    return this.languageCode;
  }
}

class MockI18nLanguageCodeService {
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

// Mocking window object here because changing location.href causes the
// full page to reload. Page reloads raise an error in karma.
class MockWindowRef {
  _window = {
    location: {
      _hash: '',
      _hashChange: null,
      get hash() {
        return this._hash;
      },
      set hash(val) {
        this._hash = val;
        if (this._hashChange === null) {
          return;
        }
        this._hashChange();
      },
      reload: (val) => val
    },
    get onhashchange() {
      return this.location._hashChange;
    },

    set onhashchange(val) {
      this.location._hashChange = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

let component: AboutPageComponent;
let fixture: ComponentFixture<AboutPageComponent>;

describe('About Page', function() {
  let windowRef: MockWindowRef;
  let siteAnalyticsServiceStub: SiteAnalyticsService;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        {provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub},
        { provide: TranslateService, useClass: MockTranslateService },
        UtilsService,
        UrlInterpolationService,
        { provide: WindowRef, useValue: windowRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    })
      .compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [AboutPageComponent]
  }));

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should activate when Visit Classroom is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickVisitClassroomButtonEvent')
      .and.callThrough();
    component.onClickVisitClassroomButton();
    expect(siteAnalyticsServiceStub.registerClickVisitClassroomButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Browse Library is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickBrowseLibraryButtonEvent')
      .and.callThrough();
    component.onClickBrowseLibraryButton();
    expect(siteAnalyticsServiceStub.registerClickBrowseLibraryButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Create Lesson is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerCreateLessonButtonEvent')
      .and.callThrough();
    component.onClickCreateLessonButton();
    expect(siteAnalyticsServiceStub.registerCreateLessonButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Guide For Teacher is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickGuideForTeacherButtonEvent')
      .and.callThrough();
    component.onClickGuideForTeacherButton();
    expect(siteAnalyticsServiceStub.registerClickGuideForTeacherButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Tip For Parent is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickTipforParentsButtonEvent')
      .and.callThrough();
    component.onClickTipsForParentsButton();
    expect(siteAnalyticsServiceStub.registerClickTipforParentsButtonEvent)
      .toHaveBeenCalledWith();
  });
});
