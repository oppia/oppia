// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ShareLessonModalComponent.
 */

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform} from '@angular/core';
import {ShareLessonModalComponent} from './share-lesson-modal.component';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {AttributionService} from 'services/attribution.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageContextService} from 'services/page-context.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('ShareLessonModalComponent', () => {
  let component: ShareLessonModalComponent;
  let fixture: ComponentFixture<ShareLessonModalComponent>;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let bottomSheetRef: jasmine.SpyObj<MatBottomSheetRef>;
  let alertsService: jasmine.SpyObj<AlertsService>;
  let urlService: jasmine.SpyObj<UrlService>;
  let attributionService: jasmine.SpyObj<AttributionService>;
  let pageContextService: jasmine.SpyObj<PageContextService>;
  let windowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;
  let mockWindow;
  let mockLocation;

  beforeEach(waitForAsync(() => {
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);
    const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addWarning',
    ]);
    const urlServiceSpy = jasmine.createSpyObj('UrlService', [
      'getCurrentLocation',
    ]);
    const attributionServiceSpy = jasmine.createSpyObj('AttributionService', [
      'getAuthors',
    ]);
    const pageContextServiceSpy = jasmine.createSpyObj('PageContextService', [
      'getExplorationId',
    ]);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );

    mockLocation = {
      href: 'https://oppia.org/explore/test-exploration',
      origin: 'https://oppia.org',
      pathname: '/explore/test-exploration',
      protocol: 'https:',
      host: 'oppia.org',
    };

    mockWindow = {
      location: mockLocation,
    };

    const windowRefSpy = jasmine.createSpyObj('WindowRef', [], {
      nativeWindow: mockWindow,
    });

    TestBed.configureTestingModule({
      declarations: [ShareLessonModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: MatBottomSheetRef, useValue: bottomSheetRefSpy},
        {provide: AlertsService, useValue: alertsServiceSpy},
        {provide: UrlService, useValue: urlServiceSpy},
        {provide: AttributionService, useValue: attributionServiceSpy},
        {provide: WindowRef, useValue: windowRefSpy},
        {provide: PageContextService, useValue: pageContextServiceSpy},
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: null},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    ngbActiveModal = TestBed.inject(
      NgbActiveModal
    ) as jasmine.SpyObj<NgbActiveModal>;
    bottomSheetRef = TestBed.inject(
      MatBottomSheetRef
    ) as jasmine.SpyObj<MatBottomSheetRef>;
    alertsService = TestBed.inject(
      AlertsService
    ) as jasmine.SpyObj<AlertsService>;
    urlService = TestBed.inject(UrlService) as jasmine.SpyObj<UrlService>;
    attributionService = TestBed.inject(
      AttributionService
    ) as jasmine.SpyObj<AttributionService>;
    pageContextService = TestBed.inject(
      PageContextService
    ) as jasmine.SpyObj<PageContextService>;
    windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareLessonModalComponent);
    component = fixture.componentInstance;

    urlService.getCurrentLocation.and.returnValue(mockLocation);
    attributionService.getAuthors.and.returnValue(['Author 1', 'Author 2']);
    pageContextService.getExplorationId.and.returnValue('test-exploration-id');
    windowDimensionsService.getWidth.and.returnValue(600);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with data when provided', () => {
    TestBed.resetTestingModule();
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);
    const bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', [
      'dismiss',
    ]);
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addWarning',
    ]);
    const urlServiceSpy = jasmine.createSpyObj('UrlService', [
      'getCurrentLocation',
    ]);
    const attributionServiceSpy = jasmine.createSpyObj('AttributionService', [
      'getAuthors',
    ]);
    const pageContextServiceSpy = jasmine.createSpyObj('PageContextService', [
      'getExplorationId',
    ]);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );
    const windowRefSpy = jasmine.createSpyObj('WindowRef', [], {
      nativeWindow: mockWindow,
    });

    TestBed.configureTestingModule({
      declarations: [ShareLessonModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: MatBottomSheetRef, useValue: bottomSheetRefSpy},
        {provide: AlertsService, useValue: alertsServiceSpy},
        {provide: UrlService, useValue: urlServiceSpy},
        {provide: AttributionService, useValue: attributionServiceSpy},
        {provide: WindowRef, useValue: windowRefSpy},
        {provide: PageContextService, useValue: pageContextServiceSpy},
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {explorationTitle: 'Test Exploration'},
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    const testFixture = TestBed.createComponent(ShareLessonModalComponent);
    const testComponent = testFixture.componentInstance;

    urlServiceSpy.getCurrentLocation.and.returnValue(mockLocation);
    attributionServiceSpy.getAuthors.and.returnValue(['Author 1', 'Author 2']);
    pageContextServiceSpy.getExplorationId.and.returnValue(
      'test-exploration-id'
    );

    testComponent.ngOnInit();

    expect(testComponent.explorationTitle).toBe('Test Exploration');
  });

  it('should initialize with undefined data when data is null', () => {
    spyOn(component, 'generateAttributionText');
    spyOn(component, 'generateEmbedCode');

    component.ngOnInit();

    expect(component.explorationTitle).toBeUndefined();
    expect(component.generateAttributionText).toHaveBeenCalled();
    expect(component.generateEmbedCode).toHaveBeenCalled();
  });

  it('should initialize with default values', () => {
    expect(component.backBtnIsVisible).toBe(false);
    expect(component.successMessageIsVisible).toBe(false);
    expect(component.successMessage).toBe('');
    expect(component.ccAttributionText).toBe('');
    expect(component.embedCode).toBe('');
    expect(component.modalState).toBe('copy');
  });

  it('should dismiss bottomSheetRef when closeModal is called and bottomSheetRef exists', () => {
    component.closeModal();

    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();
  });

  it('should dismiss ngbActiveModal when closeModal is called and bottomSheetRef does not exist', () => {
    TestBed.resetTestingModule();
    const ngbActiveModalSpy = jasmine.createSpyObj('NgbActiveModal', [
      'dismiss',
    ]);
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addWarning',
    ]);
    const urlServiceSpy = jasmine.createSpyObj('UrlService', [
      'getCurrentLocation',
    ]);
    const attributionServiceSpy = jasmine.createSpyObj('AttributionService', [
      'getAuthors',
    ]);
    const pageContextServiceSpy = jasmine.createSpyObj('PageContextService', [
      'getExplorationId',
    ]);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );
    const windowRefSpy = jasmine.createSpyObj('WindowRef', [], {
      nativeWindow: mockWindow,
    });

    TestBed.configureTestingModule({
      declarations: [ShareLessonModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: ngbActiveModalSpy},
        {provide: AlertsService, useValue: alertsServiceSpy},
        {provide: UrlService, useValue: urlServiceSpy},
        {provide: AttributionService, useValue: attributionServiceSpy},
        {provide: WindowRef, useValue: windowRefSpy},
        {provide: PageContextService, useValue: pageContextServiceSpy},
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
        {provide: MAT_BOTTOM_SHEET_DATA, useValue: null},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    const testFixture = TestBed.createComponent(ShareLessonModalComponent);
    const testComponent = testFixture.componentInstance;

    testComponent.closeModal();

    expect(ngbActiveModalSpy.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should copy lesson link successfully', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    spyOn(component, 'showSuccessMessage');

    component.copyLessonLink();
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://oppia.org/explore/test-exploration'
    );
    expect(component.showSuccessMessage).toHaveBeenCalledWith('Link Copied');
  }));

  it('should show warning when copy lesson link fails', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject());

    component.copyLessonLink();
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to copy lesson link.'
    );
  }));

  it('should set modal state when showModal is called', () => {
    component.showModal('embed');

    expect(component.modalState).toBe('embed');
  });

  it('should copy attribution successfully', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    spyOn(component, 'showSuccessMessage');
    component.ccAttributionText = 'Test attribution';

    component.copyAttribution();
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Test attribution'
    );
    expect(component.showSuccessMessage).toHaveBeenCalledWith(
      'Attribution Copied'
    );
  }));

  it('should show warning when copy attribution fails', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject());

    component.copyAttribution();
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to copy attribution text.'
    );
  }));

  it('should copy embed code successfully', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    spyOn(component, 'showSuccessMessage');
    component.embedCode = '<iframe>test</iframe>';

    component.copyEmbedCode();
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '<iframe>test</iframe>'
    );
    expect(component.showSuccessMessage).toHaveBeenCalledWith(
      'HTML Code Copied'
    );
  }));

  it('should show warning when copy embed code fails', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject());

    component.copyEmbedCode();
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to copy embed code.'
    );
  }));

  it('should show success message and hide it after 3 seconds', fakeAsync(() => {
    component.showSuccessMessage('Test Message');

    expect(component.successMessage).toBe('Test Message');
    expect(component.successMessageIsVisible).toBe(true);

    tick(3000);

    expect(component.successMessageIsVisible).toBe(false);
  }));

  it('should show attribution modal and set back button visible', () => {
    spyOn(component, 'showModal');

    component.showAttributionModal();

    expect(component.backBtnIsVisible).toBe(true);
    expect(component.showModal).toHaveBeenCalledWith('attribution');
  });

  it('should show embed modal and set back button visible', () => {
    spyOn(component, 'showModal');

    component.showEmbedModal();

    expect(component.backBtnIsVisible).toBe(true);
    expect(component.showModal).toHaveBeenCalledWith('embed');
  });

  it('should go back to copy modal and hide back button', () => {
    spyOn(component, 'showModal');

    component.goBackToCopyModal();

    expect(component.backBtnIsVisible).toBe(false);
    expect(component.showModal).toHaveBeenCalledWith('copy');
  });

  it('should generate facebook share URL', () => {
    const result = component.shareWithNetwork('facebook');
    const expected =
      'https://www.facebook.com/sharer/sharer.php?sdk=joey&u=https://oppia.org/explore/test-exploration&display=popup&ref=plugin&src=share_button';

    expect(result).toBe(expected);
  });

  it('should generate classroom share URL', () => {
    const result = component.shareWithNetwork('classroom');
    const expected =
      'https://classroom.google.com/share?url=https://oppia.org/explore/test-exploration';

    expect(result).toBe(expected);
  });

  it('should return empty string for unknown network', () => {
    const result = component.shareWithNetwork('unknown');

    expect(result).toBe('');
  });

  it('should get page URL from urlService', () => {
    const result = component.getPageUrl();

    expect(result).toBe('https://oppia.org/explore/test-exploration');
    expect(urlService.getCurrentLocation).toHaveBeenCalled();
  });

  it('should get authors from attributionService', () => {
    const result = component.getAuthors();

    expect(result).toBe('Author 1, Author 2');
    expect(attributionService.getAuthors).toHaveBeenCalled();
  });

  it('should generate embed code correctly', () => {
    component.generateEmbedCode();

    const expectedEmbedCode =
      '<iframe src="https://oppia.org/embed/exploration/test-exploration-id" width="700" height="1000"></iframe>';
    expect(component.embedCode).toBe(expectedEmbedCode);
  });

  it('should generate attribution text correctly', () => {
    component.explorationTitle = 'Test Lesson';

    component.generateAttributionText();

    const expectedAttribution =
      '"Test Lesson" by Author 1, Author 2. Oppia. https://oppia.org/explore/test-exploration';
    expect(component.ccAttributionText).toBe(expectedAttribution);
  });

  it('should return true when window is wider than mobile breakpoint', () => {
    windowDimensionsService.getWidth.and.returnValue(600);

    const result = component.isWindowNarrow();

    expect(result).toBe(true);
  });

  it('should return false when window is narrower than mobile breakpoint', () => {
    windowDimensionsService.getWidth.and.returnValue(400);

    const result = component.isWindowNarrow();

    expect(result).toBe(false);
  });

  it('should handle edge case where getAuthors returns empty array', () => {
    attributionService.getAuthors.and.returnValue([]);

    const result = component.getAuthors();

    expect(result).toBe('');
  });

  it('should handle edge case where getAuthors returns single author', () => {
    attributionService.getAuthors.and.returnValue(['Single Author']);

    const result = component.getAuthors();

    expect(result).toBe('Single Author');
  });

  it('should test modalStates enum values', () => {
    expect(component.modalStates.COPY).toBe('copy');
    expect(component.modalStates.EMBED).toBe('embed');
    expect(component.modalStates.ATTRIBUTION).toBe('attribution');
  });
});
