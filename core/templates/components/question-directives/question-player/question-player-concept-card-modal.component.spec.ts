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
 * @fileoverview Unit tests for QuestionPlayerConceptCardModalComponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { QuestionPlayerConceptCardModalComponent } from './question-player-concept-card-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockUrlService {
  getPathname() {
    return 'pathname';
  }

  getUrlParams() {
    return 'getUrlParams';
  }
}

describe('Question Player Concept Card Modal component', () => {
  let component: QuestionPlayerConceptCardModalComponent;
  let fixture: ComponentFixture<QuestionPlayerConceptCardModalComponent>;
  let urlService: UrlService;

  let mockWindow = {
    nativeWindow: {
      location: {
        replace: jasmine.createSpy('replace')
      }
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuestionPlayerConceptCardModalComponent
      ],
      providers: [
        SkillObjectFactory,
        UrlService,
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: WindowRef,
          useValue: mockWindow
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionPlayerConceptCardModalComponent);
    component = fixture.componentInstance;

    urlService = TestBed.inject(UrlService);

    fixture.detectChanges();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      component.skills = ['name1', 'name2'];
      component.ngOnInit();

      expect(component.index).toBe(0);
      expect(component.modalHeader).toEqual('name1');
    });

  it('should go to next concept card, and identify when it is the last' +
    ' concept card.', fakeAsync(() => {
    component.index = 1;
    component.skills = ['name1', 'name2'];

    component.goToNextConceptCard();
    tick();

    expect(component.index).toEqual(2);
    expect(component.isLastConceptCard()).toBe(false);
  }));

  it('should refresh page when retrying a practice test', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      selected_subtopic_ids: 'selected_subtopic_ids'
    });
    spyOn(urlService, 'getPathname').and.returnValue('pathName');

    component.retryTest();

    expect(urlService.getPathname).toHaveBeenCalled();
    expect(urlService.getUrlParams).toHaveBeenCalled();
  });
});
