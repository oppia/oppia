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
 * @fileoverview Unit tests for welcome translation tab.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WelcomeTranslationModalComponent} from './welcome-translation-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Welcome Translation Modal Component', function () {
  let component: WelcomeTranslationModalComponent;
  let fixture: ComponentFixture<WelcomeTranslationModalComponent>;
  let contextService: ContextService;
  let siteAnalyticsService: SiteAnalyticsService;

  const explorationId = 'exp1';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WelcomeTranslationModalComponent],
      providers: [
        ContextService,
        UrlInterpolationService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        SiteAnalyticsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeTranslationModalComponent);
    component = fixture.componentInstance;

    TestBed.inject(NgbActiveModal);
    TestBed.inject(UrlInterpolationService);
    contextService = TestBed.inject(ContextService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);

    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(
      siteAnalyticsService,
      'registerTutorialModalOpenEvent'
    ).and.callThrough();
    fixture.detectChanges();
  });

  it('should initialize component properties after it is initialized', function () {
    expect(component.explorationId).toBe(explorationId);
    expect(
      siteAnalyticsService.registerTutorialModalOpenEvent
    ).toHaveBeenCalledWith(explorationId);
    expect(component.translationWelcomeImgUrl).toBe(
      '/assets/copyrighted-images/general/editor_welcome.svg'
    );
  });
});
