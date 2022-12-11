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
 * @fileoverview Unit tests for CertificateDownloadModalComponent.
*/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { ContextService } from 'services/context.service';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { CertificateDownloadModalComponent } from './certificate-download-modal.component';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { AlertsService } from 'services/alerts.service';
import { ContributorCertificateResponse } from '../services/contribution-and-review-backend-api.service';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

describe('Contributor Certificate Download Modal Component', () => {
  let activeModal: NgbActiveModal;
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<CertificateDownloadModalComponent>;
  let component: CertificateDownloadModalComponent;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();
  let contributionAndReviewService: ContributionAndReviewService;
  let alertsService: AlertsService;
  const certificateDataResponse: ContributorCertificateResponse = {
    from_date: '1 Jan 2022',
    to_date: '31 Oct 2022',
    team_lead: 'Test User',
    contribution_hours: 1.0,
    language: 'Hindi'
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CertificateDownloadModalComponent,
        WrapTextWithEllipsisPipe
      ],
      providers: [
        NgbActiveModal,
        AlertsService,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    OppiaAngularRootComponent.contextService = TestBed.inject(ContextService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateDownloadModalComponent);
    component = fixture.componentInstance;
    component.suggestionType = 'translate_content';
    component.username = 'test_user';
    component.languageCode = 'hi';
    component.fromDate = '2022/01/01';
    component.toDate = '2022/12/31';
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    activeModal = TestBed.inject(NgbActiveModal);
    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    alertsService = TestBed.inject(AlertsService);
    fixture.detectChanges();
  });

  it('should download translation submitter certificate when available', () => {
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync')
      .and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();

    expect(component.errorsFound).toBeFalse();
    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
  });

  it('should download question submitter certificate when available', () => {
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    component.suggestionType = 'add_question';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync')
      .and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();

    expect(component.errorsFound).toBeFalse();
    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
  });

  it('should show error when contributions not found', fakeAsync(() => {
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync')
      .and.returnValue(Promise.reject());

    component.downloadCertificate();
    tick();

    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual(
      'Not able to download contributor certificate');
  }));

  it('should show error for invalid to date', () => {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    component.fromDate = today.toDateString();
    component.toDate = tomorrow.toDateString();

    component.downloadCertificate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual(
      'Please select a \'To\' date that is earlier than ' +
      'today\'s date'
    );
  });

  it('should show error for invalid date ranges', () => {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    component.fromDate = tomorrow.toDateString();
    component.toDate = today.toDateString();

    component.downloadCertificate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual('Invalid date range.');
  });

  it('should close', () => {
    spyOn(activeModal, 'close');
    component.close();
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should throw error when canvas context is null', () => {
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue(
        {
          width: 0,
          height: 0,
          getContext: (txt: string) => {
            return null;
          },
        }
      )
    );

    expect(() => {
      component.createCertificate(certificateDataResponse);
      tick();
    }).toThrowError();
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
