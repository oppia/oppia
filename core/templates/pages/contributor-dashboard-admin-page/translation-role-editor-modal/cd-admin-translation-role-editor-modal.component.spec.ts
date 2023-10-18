// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CdAdminTranslationRoleEditorModal.
 */

import { ComponentFixture, fakeAsync, TestBed, async, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialModule } from 'modules/material.module';

import { ContributorDashboardAdminBackendApiService } from '../services/contributor-dashboard-admin-backend-api.service';
import { AlertsService } from 'services/alerts.service';

import { CdAdminTranslationRoleEditorModal } from './cd-admin-translation-role-editor-modal.component';

describe('CdAdminTranslationRoleEditorModal', () => {
  let component: CdAdminTranslationRoleEditorModal;
  let fixture: ComponentFixture<CdAdminTranslationRoleEditorModal>;
  let ngbActiveModal: NgbActiveModal;
  let contributorDashboardAdminBackendApiService:
    ContributorDashboardAdminBackendApiService;
  let alertsService: AlertsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MaterialModule,
        HttpClientTestingModule
      ],
      declarations: [CdAdminTranslationRoleEditorModal],
      providers: [
        NgbActiveModal,
        ContributorDashboardAdminBackendApiService,
        AlertsService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CdAdminTranslationRoleEditorModal);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    contributorDashboardAdminBackendApiService = TestBed.inject(
      ContributorDashboardAdminBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    component.assignedLanguageIds = ['en', 'hi', 'ak'];
    component.languageIdToName = {
      en: 'English',
      hi: 'Hindi',
      ak: 'Ákán (Akan)',
      sk: 'shqip (Albanian)'
    };
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should update language ids for selection on initialization', () => {
    component.languageIdsForSelection = [];

    component.ngOnInit();

    expect(component.languageIdsForSelection).toEqual(['sk']);
  });

  describe('on calling addLanguage', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to add language', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync'
      ).and.resolveTo();
      component.selectedLanguageId = 'en';

      component.addLanguage();
      expect(component.languageIdInUpdate).toEqual('en');
      tick();

      expect(
        contributorDashboardAdminBackendApiService.addContributionReviewerAsync
      ).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync').and.returnValue(
        Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.selectedLanguageId = 'en';

      component.addLanguage();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));

    it('should throw error if no more language left', fakeAsync(() => {
      component.selectedLanguageId = null;

      expect(() => {
        component.addLanguage();
      }).toThrowError('Expected selectedLanguageId to be non-null.');
    }));
  });

  describe('on calling removeLanguageId', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to remove language', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync').and.resolveTo();

      component.removeLanguageId('hi');
      expect(component.languageIdInUpdate).toEqual('hi');
      tick();

      expect(
        contributorDashboardAdminBackendApiService
          .removeContributionReviewerAsync).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync').and.returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.removeLanguageId('hi');
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));
  });

  it('should close without returning anything', () => {
    const modalCloseSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.assignedLanguageIds = ['en'];

    component.close();

    expect(modalCloseSpy).toHaveBeenCalledWith();
  });
});
