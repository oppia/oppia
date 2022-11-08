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
import { PlatformFeatureService } from 'services/platform-feature.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { OppiaFooterComponent } from './oppia-footer.component';

class MockPlatformFeatureService {
  status = {
    BlogPages: {
      isEnabled: false
    }
  };
}

describe('OppiaFooterComponent', () => {
  let component: OppiaFooterComponent;
  let fixture: ComponentFixture<OppiaFooterComponent>;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        OppiaFooterComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaFooterComponent);
    component = fixture.componentInstance;
  });

  it('should get the siteFeedbackFormURL', () => {
    expect(component.siteFeedbackFormUrl)
      .toBe(AppConstants.SITE_FEEDBACK_FORM_URL);
  });

  it('should get the pages registered with frontend', () => {
    expect(component.PAGES_REGISTERED_WITH_FRONTEND)
      .toBe(AppConstants.PAGES_REGISTERED_WITH_FRONTEND);
  });

  it('should return correct blog url if the blog homepage feature is enabled',
    () => {
      mockPlatformFeatureService.status.BlogPages.isEnabled = true;

      expect(component.getOppiaBlogUrl()).toEqual('/blog');
    });

  it('should return correct blog url if the blog homepage feature is disabled',
    () => {
      mockPlatformFeatureService.status.BlogPages.isEnabled = false;

      expect(component.getOppiaBlogUrl()).toEqual(
        'https://medium.com/oppia-org');
    });
});
