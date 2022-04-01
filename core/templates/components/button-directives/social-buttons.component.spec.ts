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
 * @fileoverview Unit tests for SocialButtonsComponent
 */

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SocialButtonsComponent } from './social-buttons.component';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

describe('SocialButtonsComponent', () => {
  let component: SocialButtonsComponent;
  let fixture: ComponentFixture<SocialButtonsComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [SocialButtonsComponent, MockTranslatePipe],
      providers: []
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialButtonsComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toBeTrue();
  });
});
