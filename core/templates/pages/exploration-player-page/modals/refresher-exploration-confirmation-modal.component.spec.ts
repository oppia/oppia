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
 * @fileoverview Unit tests for RefresherExplorationConfirmationModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { RefresherExplorationConfirmationModal } from './refresher-exploration-confirmation-modal.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('Refresher Exploration Confirmation Modal', () => {
  let fixture: ComponentFixture<RefresherExplorationConfirmationModal>;
  let componentInstance: RefresherExplorationConfirmationModal;
  let collectionId: string = 'test_id';
  let mockUrlService: MockUrlService;
  let ngbActiveModal: NgbActiveModal;
  let windowRef: WindowRef;

  class MockUrlService {
    getUrlParams(): object {
      return { collection_id: collectionId };
    }

    getQueryFieldValuesAsList(feildName: string): string[] {
      return ['parent_id_1', 'parent_id_2'];
    }

    getPathname(): string {
      return 'path_name';
    }

    addField(url: string, fieldname: string, fieldvalue: string) {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        MockTranslatePipe,
        RefresherExplorationConfirmationModal
      ],
      providers: [
        WindowRef,
        ExplorationEngineService,
        UrlInterpolationService,
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        NgbActiveModal,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefresherExplorationConfirmationModal);
    componentInstance = fixture.componentInstance;
    componentInstance.refresherExplorationId = 'test_id';
    mockUrlService = TestBed.inject(UrlService);
    windowRef = TestBed.inject(WindowRef);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should confirm redirect', fakeAsync(() => {
    let callbackSpy = jasmine.createSpy();
    componentInstance.confirmRedirectEventEmitter.subscribe(() => {
      callbackSpy();
    });
    spyOn(mockUrlService, 'addField');
    spyOn(windowRef.nativeWindow, 'open');
    spyOn(ngbActiveModal, 'close');
    componentInstance.confirmRedirect();
    tick(500);
    expect(callbackSpy).toHaveBeenCalled();
    expect(mockUrlService.addField).toHaveBeenCalledTimes(4);
    expect(windowRef.nativeWindow.open).toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  }));
});
