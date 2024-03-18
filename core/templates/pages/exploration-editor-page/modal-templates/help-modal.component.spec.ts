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
 * @fileoverview Unit tests for HelpModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HelpModalComponent} from './help-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ContextService} from 'services/context.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

describe('Exploration Player Suggestion Modal Controller', function () {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;
  let siteAnalyticsService: SiteAnalyticsService;
  let contextService: ContextService;
  let ngbActiveModal: NgbActiveModal;
  let explorationId = 'exp1';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HelpModalComponent],
      providers: [SiteAnalyticsService, ContextService, NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(function () {
    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    contextService = TestBed.inject(ContextService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
  });

  it('should begin editor tutorial when closing the modal', function () {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    const registerOpenTutorialFromHelpCenterEventSpy = spyOn(
      siteAnalyticsService,
      'registerOpenTutorialFromHelpCenterEvent'
    );
    component.ngOnInit();

    component.beginEditorTutorial();

    expect(registerOpenTutorialFromHelpCenterEventSpy).toHaveBeenCalledWith(
      explorationId
    );
    expect(closeSpy).toHaveBeenCalledWith('editor');
  });

  it('should begin translation tutorial when closing the modal', function () {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    let registerOpenTutorialFromHelpCenterEventSpy = spyOn(
      siteAnalyticsService,
      'registerOpenTutorialFromHelpCenterEvent'
    );
    component.ngOnInit();

    component.beginTranslationTutorial();

    expect(registerOpenTutorialFromHelpCenterEventSpy).toHaveBeenCalledWith(
      explorationId
    );
    expect(closeSpy).toHaveBeenCalledWith('translation');
  });

  it('should dismiss modal when changing to help center', function () {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    let registerVisitHelpCenterEventSpy = spyOn(
      siteAnalyticsService,
      'registerVisitHelpCenterEvent'
    );
    component.ngOnInit();

    component.goToHelpCenter();

    expect(registerVisitHelpCenterEventSpy).toHaveBeenCalledWith(explorationId);
    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });
});
