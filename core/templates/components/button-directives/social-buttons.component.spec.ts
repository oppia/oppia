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
import { TestBed, waitForAsync } from '@angular/core/testing';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockPlatformFeatureService {
  status = {
    AndroidBetaLandingPage: {
      isEnabled: false
    }
  };
}

describe('SocialButtonsComponent', () => {
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SocialButtonsComponent, MockTranslatePipe],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should show android app button', () => {
    mockPlatformFeatureService.status.AndroidBetaLandingPage.isEnabled = true;

    const component = TestBed.createComponent(SocialButtonsComponent);

    expect(component.componentInstance.androidAppButtonIsShown).toBeTrue();
  });
});
