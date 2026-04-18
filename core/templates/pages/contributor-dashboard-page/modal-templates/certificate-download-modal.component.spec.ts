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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';

import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {OppiaAngularRootComponent} from 'components/oppia-angular-root.component';
import {PageContextService} from 'services/page-context.service';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {CertificateDownloadModalComponent} from './certificate-download-modal.component';
import {ContributionAndReviewService} from '../services/contribution-and-review.service';
import {AlertsService} from 'services/alerts.service';
import {
  ContributorCertificateResponse,
  ContributorCertificateInfo,
} from '../services/contribution-and-review-backend-api.service';
import {HttpErrorResponse} from '@angular/common/http';

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
  const certificateData: ContributorCertificateInfo = {
    from_date: '1 Jan 2022',
    to_date: '31 Oct 2022',
    team_lead: 'Test User',
    contribution_hours: 1.0,
    contribution_word_count: 300,
    language: 'Hindi',
  };
  const certificateDataResponse: ContributorCertificateResponse = {
    certificate_data: certificateData,
  };
  const emptyCertificateDataResponse: ContributorCertificateResponse = {
    certificate_data: null,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CertificateDownloadModalComponent,
        WrapTextWithEllipsisPipe,
      ],
      providers: [
        NgbActiveModal,
        AlertsService,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    OppiaAngularRootComponent.pageContextService =
      TestBed.inject(PageContextService);
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
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();

    expect(component.errorsFound).toBeFalse();
    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
  });

  it('should download translation submitter certificate with minutes', fakeAsync(() => {
    const certificateDataWithMinutes: ContributorCertificateInfo = {
      ...certificateData,
      contribution_hours: 0.15,
      contribution_word_count: 45,
    };
    const certificateDataWithMinutesResponse: ContributorCertificateResponse = {
      certificate_data: certificateDataWithMinutes,
    };
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataWithMinutesResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();
    flushMicrotasks();

    expect(component.errorsFound).toBeFalse();
    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
  }));

  it('should download question submitter certificate when available', () => {
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    component.suggestionType = 'add_question';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();

    expect(component.errorsFound).toBeFalse();
    expect(
      contributionAndReviewService.downloadContributorCertificateAsync
    ).toHaveBeenCalled();
  });

  it('should set max selectable date on both date pickers', () => {
    const dateInputs =
      fixture.nativeElement.querySelectorAll('input[type="date"]');

    expect(dateInputs.length).toBe(2);
    dateInputs.forEach((input: HTMLInputElement) => {
      expect(input.max).toBe(component.maxSelectableDate);
    });
  });

  it('should set errorsFound and errorMessage for To date in the future', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    component.fromDate = '2023-10-01';
    component.toDate = tomorrow.toDateString();
    component.validateDate();
    expect(component.errorsFound).toBe(true);
    expect(component.errorMessage).toBe(
      "Please select a 'To' date that is not in the future."
    );
  });

  it('should show error for invalid to date', () => {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    component.fromDate = today.toDateString();
    component.toDate = tomorrow.toDateString();

    component.validateDate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual(
      "Please select a 'To' date that is not in the future."
    );
  });

  it('should show error for no contributions found', fakeAsync(() => {
    component.fromDate = '2020/01/01';
    component.toDate = '2020/01/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(emptyCertificateDataResponse));
    spyOn(alertsService, 'addInfoMessage').and.stub();

    component.downloadCertificate();

    flushMicrotasks();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual(
      'There are no contributions for the given date range.'
    );
  }));

  it('should show error for invalid date ranges', () => {
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    component.fromDate = tomorrow.toDateString();
    component.toDate = today.toDateString();

    component.validateDate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual('Invalid date range.');
  });

  it('should not show errors for valid dates', () => {
    const today = new Date();
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(today.getDate() - 1);
    toDate.setDate(today.getDate() - 1);

    component.fromDate = fromDate.toDateString();
    component.toDate = toDate.toDateString();

    component.validateDate();

    expect(component.errorsFound).toBeFalse();
    expect(component.errorMessage).toEqual('');
  });

  it('should close', () => {
    spyOn(activeModal, 'close');
    component.close();
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should handle errors properly', fakeAsync(() => {
    const mockError = new HttpErrorResponse({error: {error: 'Error message'}});
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.reject(mockError));

    component.downloadCertificate();

    flushMicrotasks();

    expect(component.errorsFound).toBe(true);
    expect(component.isDownloading).toBe(false);
    expect(component.errorMessage).toBe('Error message');
  }));

  it('should throw error when canvas context is null', () => {
    spyOn(document, 'createElement').and.callFake(
      jasmine.createSpy('createElement').and.returnValue({
        width: 0,
        height: 0,
        getContext: (txt: string) => {
          return null;
        },
      })
    );

    expect(() => {
      component.createCertificate(certificateData);
      tick();
    }).toThrowError();
  });

  it('should print certificate when data is available', fakeAsync(() => {
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(component, 'createCertificate');

    component.printCertificate();

    expect(component.isPrinting).toBeTrue();
    expect(component.isCancelled).toBeFalse();

    flushMicrotasks();

    expect(component.createCertificate).toHaveBeenCalledWith(
      certificateData,
      true
    );
    expect(component.isPrinting).toBeFalse();
  }));

  it('should show error when printing with no contributions', fakeAsync(() => {
    component.fromDate = '2020/01/01';
    component.toDate = '2020/01/31';
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(emptyCertificateDataResponse));

    component.printCertificate();

    flushMicrotasks();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual(
      'There are no contributions for the given date range.'
    );
    expect(component.isPrinting).toBeFalse();
  }));

  it('should handle errors in printCertificate', fakeAsync(() => {
    const mockError = new HttpErrorResponse({error: {error: 'Print error'}});
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.reject(mockError));

    component.printCertificate();

    flushMicrotasks();

    expect(component.errorsFound).toBeTrue();
    expect(component.isPrinting).toBeFalse();
    expect(component.errorMessage).toBe('Print error');
  }));

  it('should not proceed with print if cancelled', fakeAsync(() => {
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(component, 'createCertificate');

    component.printCertificate();
    component.close();

    flushMicrotasks();

    expect(component.isCancelled).toBeTrue();
    expect(component.createCertificate).not.toHaveBeenCalled();
  }));

  it('should not proceed with download if cancelled', fakeAsync(() => {
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.resolve(certificateDataResponse));
    spyOn(component, 'createCertificate');

    component.downloadCertificate();
    component.close();

    flushMicrotasks();

    expect(component.isCancelled).toBeTrue();
    expect(component.createCertificate).not.toHaveBeenCalled();
  }));

  it('should not show error if download is cancelled during error', fakeAsync(() => {
    const mockError = new HttpErrorResponse({error: {error: 'Network error'}});
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.reject(mockError));

    component.downloadCertificate();
    component.close();

    flushMicrotasks();

    expect(component.isCancelled).toBeTrue();
    expect(component.errorsFound).toBeFalse();
  }));

  it('should not show error if print is cancelled during error', fakeAsync(() => {
    const mockError = new HttpErrorResponse({error: {error: 'Network error'}});
    spyOn(
      contributionAndReviewService,
      'downloadContributorCertificateAsync'
    ).and.returnValue(Promise.reject(mockError));

    component.printCertificate();
    component.close();

    flushMicrotasks();

    expect(component.isCancelled).toBeTrue();
    expect(component.errorsFound).toBeFalse();
  }));

  it('should return true for isDownloadDisabled when downloading', () => {
    component.isDownloading = true;
    expect(component.isDownloadDisabled).toBeTrue();
  });

  it('should return true for isDownloadDisabled when printing', () => {
    component.isPrinting = true;
    expect(component.isDownloadDisabled).toBeTrue();
  });

  it('should return true for isDownloadDisabled when errors found', () => {
    component.errorsFound = true;
    expect(component.isDownloadDisabled).toBeTrue();
  });

  it('should return true for isDownloadDisabled when dates are undefined', () => {
    component.fromDate = undefined as unknown as string;
    expect(component.isDownloadDisabled).toBeTrue();
  });

  it('should return false for isDownloadDisabled when everything is valid', () => {
    component.isDownloading = false;
    component.isPrinting = false;
    component.errorsFound = false;
    component.fromDate = '2022/01/01';
    component.toDate = '2022/10/31';
    expect(component.isDownloadDisabled).toBeFalse();
  });

  it('should set isCancelled to true when close is called', () => {
    spyOn(activeModal, 'close');
    expect(component.isCancelled).toBeFalse();
    component.close();
    expect(component.isCancelled).toBeTrue();
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should show error for invalid date range when fromDate is not set', () => {
    component.fromDate = '' as unknown as string;
    component.toDate = '2022/10/31';

    component.validateDate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual('Invalid date range.');
  });

  it('should show error for invalid date range when toDate is not set', () => {
    component.fromDate = '2022/01/01';
    component.toDate = '' as unknown as string;

    component.validateDate();

    expect(component.errorsFound).toBeTrue();
    expect(component.errorMessage).toEqual('Invalid date range.');
  });

  it('should return true for disableDownloadButton when toDate is undefined', () => {
    component.toDate = undefined as unknown as string;
    expect(component.disableDownloadButton()).toBeTrue();
  });

  it('should trigger print flow when createCertificate is called with isPrinting true', () => {
    const mockBlob = new Blob(['image'], {type: 'image/png'});
    const mockUrl = 'blob:mock-url';
    const mockIframe = document.createElement('iframe');

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        drawImage: () => {},
        font: '',
        textAlign: '',
        fillText: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
      }),
      toBlob: (cb: (blob: Blob | null) => void) => cb(mockBlob),
      toDataURL: () => '',
    };

    spyOn(document, 'createElement').and.callFake((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });

    spyOn(URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(URL, 'revokeObjectURL');
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.createCertificate(certificateData, true);

    const image = new Image();
    image.dispatchEvent(new Event('load'));
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
