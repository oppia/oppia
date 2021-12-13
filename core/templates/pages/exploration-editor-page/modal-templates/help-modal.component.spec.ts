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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { HelpModalComponent } from './help-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Help Modal Component', function() {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;
  let contextService: ContextService = null;
  let siteAnalyticsService: SiteAnalyticsService = null;
  let registerOpenTutorialFromHelpCenterEventSpy = null;
  let ngbActiveModal: NgbActiveModal = null;
  let registerVisitHelpCenterEventSpy = null;
  let explorationId: string = 'exp1';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        HelpModalComponent
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
       },
        SiteAnalyticsService,
        ContextService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    
    fixture.detectChanges();
  });

  it('should begin editor tutorial when closing the modal', () => {
    spyOn(ngbActiveModal,'close');
    registerOpenTutorialFromHelpCenterEventSpy = spyOn(
      siteAnalyticsService, 'registerOpenTutorialFromHelpCenterEvent');

    component.beginEditorTutorial();

    expect(registerOpenTutorialFromHelpCenterEventSpy)
      .toHaveBeenCalledWith(explorationId);
    expect(ngbActiveModal.close).toHaveBeenCalledWith('editor');
  });

  it('should begin translation tutorial when closing the modal', () => {
    spyOn(ngbActiveModal,'close');
    registerOpenTutorialFromHelpCenterEventSpy = spyOn(
      siteAnalyticsService, 'registerOpenTutorialFromHelpCenterEvent');

    component.beginTranslationTutorial();

    expect(registerOpenTutorialFromHelpCenterEventSpy)
      .toHaveBeenCalledWith(explorationId);
    expect(ngbActiveModal.close).toHaveBeenCalledWith('translation');
  });

  it('should dismiss modal when changing to help center', () => {
    spyOn(ngbActiveModal,'dismiss');
    registerVisitHelpCenterEventSpy = spyOn(
       siteAnalyticsService, 'registerVisitHelpCenterEvent');

    component.goToHelpCenter();

    expect(registerVisitHelpCenterEventSpy).toHaveBeenCalledWith(explorationId);
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});