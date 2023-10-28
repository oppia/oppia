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
 * @fileoverview Unit tests for WelcomeModalComponent.
 */

import { Component, NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WelcomeModalComponent } from './welcome-modal.component';

@Component({
  selector: 'oppia-changes-in-human-readable-form',
  template: ''
})
class ChangesInHumanReadableFormComponentStub {
}

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Welcome Modal Component', () => {
  let component: WelcomeModalComponent;
  let fixture: ComponentFixture<WelcomeModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;
  let siteAnalyticsService: SiteAnalyticsService;
  const explorationId = 'exp1';
  let siteAnalyticsServiceSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        WelcomeModalComponent,
        ChangesInHumanReadableFormComponentStub
      ],
      providers: [
        ContextService,
        SiteAnalyticsService,
        UrlInterpolationService, {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    siteAnalyticsServiceSpy = spyOn(
      siteAnalyticsService, 'registerTutorialModalOpenEvent');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    fixture.detectChanges();
  });

  it ('should evaluate exploration id when component is initialized', () => {
    const welcomeModalRef = new ElementRef(document.createElement('h1'));
    component.welcomeHeading = welcomeModalRef;
    expect(component.explorationId).toBe(explorationId);
    expect(component.editorWelcomeImgUrl).toBe(
      '/assets/images/general/editor_welcome.svg');
    expect(siteAnalyticsServiceSpy)
      .toHaveBeenCalled();
  });

  it ('should close the modal', () => {
    const welcomeModalRef = new ElementRef(document.createElement('h1'));
    component.welcomeHeading = welcomeModalRef;
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalledWith();
  });
});
