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
 * @fileoverview Unit tests for sign up page component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoaderService } from 'services/loader.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { MockTranslateDirective, MockTranslatePipe } from 'tests/unit-test-utils';
import { SignupPageBackendApiService } from './services/signup-page-backend-api.service';
import { SignupPageComponent } from './signup-page.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Sign up page component', () => {
  let fixture: ComponentFixture<SignupPageComponent>;
  let componentInstance: SignupPageComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModalModule
      ],
      declarations: [
        SignupPageComponent,
        MockTranslatePipe,
        MockTranslateDirective
      ],
      providers: [
        WindowRef,
        AlertsService,
        FocusManagerService,
        LoaderService,
        SignupPageBackendApiService,
        SiteAnalyticsService,
        UrlInterpolationService,
        UrlService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupPageComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });
});
