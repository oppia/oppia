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
 * @fileoverview Unit tests for the Post Publish Modal.
 */

import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PostPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/post-publish-modal.component';

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

describe('Post Publish Modal Controller', function() {
  let component: PostPublishModalComponent;
  let fixture: ComponentFixture<PostPublishModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;
  let urlInterpolationService: UrlInterpolationService;

  const explorationId = 'exp1';
  const address = '/general/congrats.svg';
  class MockWindowRef {
    nativeWindow = {
      location: {
        protocol: 'https:',
        host: 'www.oppia.org'
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        PostPublishModalComponent,
        ChangesInHumanReadableFormComponentStub
      ],
      providers: [
        ContextService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        UrlInterpolationService, {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostPublishModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(address);
    fixture.detectChanges();
  });

  it('should evaluate exploration id when component is initialized', () => {
    expect(component.congratsImgUrl).toBe(address);
    expect(component.explorationId).toBe(explorationId);
    expect(component.explorationLinkCopied).toBe(false);
    expect(component.explorationLink).toBe('https://www.oppia.org/explore/exp1');
  });

  it('should close the modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalledWith();
  });
});
