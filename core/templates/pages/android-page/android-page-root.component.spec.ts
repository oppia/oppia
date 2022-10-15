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
 * @fileoverview Unit tests for the Android page root component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { AndroidPageRootComponent } from './android-page-root.component';

class MockPlatformFeatureService {
  status = {
    AndroidBetaLandingPage: {
      isEnabled: false
    }
  };
}

describe('Android Page Root', () => {
  let fixture: ComponentFixture<AndroidPageRootComponent>;
  let component: AndroidPageRootComponent;
  let pageHeadService: PageHeadService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AndroidPageRootComponent,
        MockTranslatePipe
      ],
      imports: [HttpClientTestingModule],
      providers: [
        PageHeadService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AndroidPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    mockPlatformFeatureService.status.AndroidBetaLandingPage.isEnabled = true;
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    const componentInstance = (
      TestBed.createComponent(AndroidPageRootComponent).componentInstance
    );

    expect(componentInstance.androidPageIsEnabled).toBeTrue();

    componentInstance.ngOnInit();

    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.TITLE,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.META);
  });

  it('should show android page if it is enabled', () => {
    // The androidPageIsEnabled property is set when the component is
    // constructed and the value is not modified after that so there is no
    // pre-check for this test.
    mockPlatformFeatureService.status.AndroidBetaLandingPage.isEnabled = true;

    const component = TestBed.createComponent(AndroidPageRootComponent);

    expect(component.componentInstance.androidPageIsEnabled).toBeTrue();
  });
});
