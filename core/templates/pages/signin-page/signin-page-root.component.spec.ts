// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the signin page root component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {PageHeadService} from '../../services/page-head.service';
import {SigninAnalyticsService} from '../../services/signin-analytics.service';
import {WindowRef} from '../../services/contextual/window-ref.service';
import {SigninPageRootComponent} from './signin-page-root.component';

describe('SigninPageRootComponent', () => {
  let fixture: ComponentFixture<SigninPageRootComponent>;
  let component: SigninPageRootComponent;
  let pageHeadService: PageHeadService;
  let signinAnalyticsService: SigninAnalyticsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SigninPageRootComponent],
      providers: [PageHeadService, SigninAnalyticsService, WindowRef],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SigninPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.get(PageHeadService);
    signinAnalyticsService = TestBed.get(SigninAnalyticsService);
  });

  it('should initialize and update title and meta tags', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(signinAnalyticsService, 'logSigninPageLoadedEvent');

    component.ngOnInit();

    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      'Sign In - Oppia',
      'Sign in to your Oppia account.'
    );
    expect(signinAnalyticsService.logSigninPageLoadedEvent).toHaveBeenCalled();
  });
});
