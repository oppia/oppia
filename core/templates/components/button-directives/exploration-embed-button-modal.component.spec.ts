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
 * @fileoverview Unit tests for ExplorationEmbedButtonModalComponent.
 */

import { ComponentFixture, fakeAsync, TestBed, async } from
  '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ExplorationEmbedButtonModalComponent } from
  './exploration-embed-button-modal.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';

class MockActiveModal {
  dismiss(): void {
    return;
  }
}

class MockSiteAnalyticsService {
  registerOpenEmbedInfoEvent(id: string): void {
    return;
  }
}

describe('ExplorationEmbedButtonModalComponent', () => {
  let component: ExplorationEmbedButtonModalComponent;
  let fixture: ComponentFixture<ExplorationEmbedButtonModalComponent>;
  let siteAnalyticsService: SiteAnalyticsService;
  let ngbActiveModal: NgbActiveModal;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExplorationEmbedButtonModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: SiteAnalyticsService,
          useClass: MockSiteAnalyticsService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationEmbedButtonModalComponent);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
    ngbActiveModal = TestBed.get(NgbActiveModal);
    component.explorationId = '3f6cD869';
    component.serverName = 'https://oppia.org';
    fixture.detectChanges();
  });

  it('should call the site analytics service when initialized', () => {
    const registerOpenEmbedInfoEventSpy = spyOn(
      siteAnalyticsService, 'registerOpenEmbedInfoEvent'
    ).and.callThrough();
    component.ngOnInit();
    expect(registerOpenEmbedInfoEventSpy).toHaveBeenCalledWith('3f6cD869');
  });

  it('should dismiss the modal when clicked on cancel', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    let closeButtonDE = fixture.debugElement.query(
      By.css('.modal-footer .btn.btn-secondary'));
    closeButtonDE.nativeElement.click();
    fixture.detectChanges();
    expect(dismissSpy).toHaveBeenCalled();
  }));

  it('should select the embed url', fakeAsync(() => {
    const removeAllRanges = jasmine.createSpy('removeAllRanges');
    const addRange = jasmine.createSpy('addRange');
    // This throws "Argument of type '{ removeAllRanges:
    // jasmine.Spy<jasmine.Func>; addRange: jasmine.Spy<jasmine.Func>; }'
    // is not assignable to parameter of type 'Selection'." This is because
    // the type of the actual 'getSelection' function doesn't match the type
    // of function we've mocked it to. We need to suppress this error because
    // we need to mock 'getSelection' function to our function for testing
    // purposes.
    // @ts-expect-error
    spyOn(window, 'getSelection').and.returnValue({
      removeAllRanges: removeAllRanges,
      addRange: addRange
    });

    let embedUrlDiv = fixture.debugElement.query(
      By.css('.oppia-embed-modal-code'));
    embedUrlDiv.nativeElement.click();
    fixture.detectChanges();
    expect(addRange).toHaveBeenCalled();
    expect(removeAllRanges).toHaveBeenCalled();
  }));

  it('should throw Error if codeDiv is null', () => {
    let event = {
      type: 'click',
      currentTarget: null
    };
    expect(() => {
      // This throws "Argument of type '{ type: string; currentTarget:
      // () => any; }' is not assignable to parameter of type 'MouseEvent'."
      // We need to suppress this error because we need to test selectText
      // function.
      // @ts-expect-error
      component.selectText(event);
    }).toThrowError('No CodeDiv was found!');
  });

  it('should throw Error if selection is null', fakeAsync(() => {
    const removeAllRanges = jasmine.createSpy('removeAllRanges');
    const addRange = jasmine.createSpy('addRange');
    spyOn(window, 'getSelection').and.returnValue(null);

    let embedUrlDiv = fixture.debugElement.query(
      By.css('.oppia-embed-modal-code'));
    embedUrlDiv.nativeElement.click();
    fixture.detectChanges();
    expect(addRange).not.toHaveBeenCalled();
    expect(removeAllRanges).not.toHaveBeenCalled();
  }));
});
