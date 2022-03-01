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
 * @fileoverview Tests for the Oppia Footer Component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { OppiaFooterComponent } from './oppia-footer.component';

describe('OppiaFooterComponent', () => {
  let component: OppiaFooterComponent;
  let fixture: ComponentFixture<OppiaFooterComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        OppiaFooterComponent,
        MockTranslatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaFooterComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should get the siteFeedbackFormURL', () => {
    expect(component.siteFeedbackFormUrl)
      .toBe(AppConstants.SITE_FEEDBACK_FORM_URL);
  });

  it('should get the pages registered with frontend', () => {
    expect(component.PAGES_REGISTERED_WITH_FRONTEND)
      .toBe(AppConstants.PAGES_REGISTERED_WITH_FRONTEND);
  });

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toEqual(true);
  });
});
