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
 * @fileoverview Unit tests for TranslationCoordinatorRoleEditorModalComponent.
 */

import { ComponentFixture, fakeAsync, TestBed, async, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialModule } from 'modules/material.module';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { AlertsService } from 'services/alerts.service';

import { TranslationCoordinatorRoleEditorModalComponent } from './translation-coordinator-role-editor-modal.component';

describe('TranslationCoordinatorRoleEditorModalComponent', () => {
  let component: TranslationCoordinatorRoleEditorModalComponent;
  let fixture: ComponentFixture<TranslationCoordinatorRoleEditorModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let adminBackendApiService: AdminBackendApiService;
  let alertsService: AlertsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MaterialModule,
        HttpClientTestingModule
      ],
      declarations: [TranslationCoordinatorRoleEditorModalComponent],
      providers: [
        NgbActiveModal,
        AdminBackendApiService,
        AlertsService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationCoordinatorRoleEditorModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    component.coordinatedLanguageIds = ['en', 'hi', 'ak'];
    component.languageIdToName = {
      en: 'English',
      hi: 'Hindi',
      ak: 'Ákán (Akan)',
      sk: 'shqip (Albanian)'
    };
    fixture.detectChanges();
  });

  it('should update topic ids for selection on initialization', () => {
    component.languageIdsForSelection = [];

    component.ngOnInit();

    expect(component.languageIdsForSelection).toEqual(['sk']);
  });

  describe('on calling addLanguage', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to add topic', fakeAsync(() => {
      spyOn(
        adminBackendApiService, 'assignTranslationCoordinator').and.resolveTo();
      component.newLanguageId = 'en';

      component.addLanguage();
      expect(component.languageIdInUpdate).toEqual('en');
      tick();

      expect(
        adminBackendApiService.assignTranslationCoordinator).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        adminBackendApiService, 'assignTranslationCoordinator').and.returnValue(
        Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.newLanguageId = 'en';

      component.addLanguage();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));

    it('should throw error if no more topic left', fakeAsync(() => {
      component.newLanguageId = null;

      expect(() => {
        component.addLanguage();
      }).toThrowError('Expected newLanguageId to be non-null.');
    }));
  });

  describe('on calling removeLanguageId', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to remove topic', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'deassignTranslationCoordinator').and.resolveTo();

      component.removeLanguageId('hi');
      expect(component.languageIdInUpdate).toEqual('hi');
      tick();

      expect(
        adminBackendApiService
          .deassignTranslationCoordinator).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'deassignTranslationCoordinator').and.returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.removeLanguageId('hi');
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));
  });

  it('should close with correct managed topic ids', () => {
    const modalCloseSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.coordinatedLanguageIds = ['en'];

    component.close();

    expect(modalCloseSpy).toHaveBeenCalledWith(['en']);
  });
});
