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
 * @fileoverview Unit tests for the pending account deletion root component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PendingAccountDeletionPageRootComponent } from './pending-account-deletion-page-root.component';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('Pending Account Deletion Page Root', () => {
  let fixture: ComponentFixture<PendingAccountDeletionPageRootComponent>;
  let component: PendingAccountDeletionPageRootComponent;
  let pageHeadService: PageHeadService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        PendingAccountDeletionPageRootComponent,
        MockTranslatePipe
      ],
      providers: [
        PageHeadService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingAccountDeletionPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should initialize and subscribe to onLangChange', () => {
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();

    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(component.pageIsShown).toBeTrue();
  });

  it('should update page title whenever the language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitleAndMetaTags');

    translateService.onLangChange.emit();

    expect(component.setPageTitleAndMetaTags).toHaveBeenCalled();
  });

  it('should obtain translated title and set the title and meta tags', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageHeadService, 'updateTitleAndMetaTags');

    component.setPageTitleAndMetaTags();

    expect(translateService.instant).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND
        .PENDING_ACCOUNT_DELETION.TITLE);
    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND
        .PENDING_ACCOUNT_DELETION.TITLE,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND
        .PENDING_ACCOUNT_DELETION.META);
  });

  it('should unsubscribe on component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
