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
 * @fileoverview Tests for Learner Local Nav Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { MockTranslatePipe } from 'tests/unit-test-utils';

import { AppConstants } from 'app.constants';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { AttributionService } from 'services/attribution.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { LearnerLocalNavBackendApiService } from '../services/learner-local-nav-backend-api.service';

import { LearnerLocalNavComponent } from './learner-local-nav.component';
import { FlagExplorationModalComponent } from '../modals/flag-exploration-modal.component';
import { UserInfo } from 'domain/user/user-info.model';

describe('Learner Local Nav Component ', () => {
  let component: LearnerLocalNavComponent;
  let fixture: ComponentFixture<LearnerLocalNavComponent>;
  let ngbModal: NgbModal;
  let attributionService: AttributionService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let userService: UserService;

  const MockNgbPopover = jasmine.createSpyObj(
    'NgbPopover', ['close', 'toggle']);

  const explorationBackendResponse = {
    can_edit: true,
    draft_change_list_id: 0,
    displayable_language_codes: [],
    exploration: {
      init_state_name: 'state_name',
      param_changes: [],
      param_specs: {},
      states: {},
      title: '',
      language_code: '',
      objective: '',
      next_content_id_index: 0
    },
    exploration_metadata: {
      title: '',
      category: '',
      objective: '',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: '',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true
    },
    exploration_id: 'test_id',
    is_logged_in: true,
    session_id: 'test_session',
    version: 1,
    preferred_audio_language_code: 'en',
    preferred_language_codes: [],
    auto_tts_enabled: false,
    record_playthrough_probability: 1,
    has_viewed_lesson_info_modal_once: false,
    furthest_reached_checkpoint_exp_version: 1,
    furthest_reached_checkpoint_state_name: 'State B',
    most_recently_reached_checkpoint_state_name: 'State A',
    most_recently_reached_checkpoint_exp_version: 1
  };

  const userInfoForCollectionCreator = UserInfo.createDefault();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerLocalNavComponent,
        MockTranslatePipe,
        NgbPopover
      ],
      providers: [
        AlertsService,
        AttributionService,
        ExplorationEngineService,
        LoaderService,
        ReadOnlyExplorationBackendApiService,
        UserService,
        LearnerLocalNavBackendApiService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LearnerLocalNavComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    userService = TestBed.inject(UserService);
    ngbModal = TestBed.inject(NgbModal);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    attributionService = TestBed.inject(AttributionService);
  });

  afterAll(() => {
    // This throws 'Cannot assign to 'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS'
    // because it is a read-only property.'. We need to suppress this error
    // because we need to change the value of
    // 'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS' for testing purposes.
    // @ts-expect-error
    AppConstants.ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS = true;
  });

  it('should set properties when initialized', fakeAsync(() => {
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.resolveTo(explorationBackendResponse);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // This throws 'Cannot assign to 'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS'
    // because it is a read-only property.'. We need to suppress this error
    // because we need to change the value of
    // 'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS' for testing purposes.
    // @ts-expect-error
    AppConstants.ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS = false;

    // Pre-checks.
    expect(component.explorationId).toBeUndefined();
    expect(component.canEdit).toBeFalse();

    component.ngOnInit();
    tick();

    expect(component.explorationId).toBe('test_id');
    expect(component.canEdit).toBe(true);
  }));

  it('should open a modal to report exploration when ' +
    'clicking on flag button', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: {},
          result: Promise.resolve()
        }) as NgbModalRef;
    });

    component.showFlagExplorationModal();

    expect(modalSpy).toHaveBeenCalledWith(
      FlagExplorationModalComponent, {backdrop: 'static'});
  });

  it('should toggle feedback popover', () => {
    component.feedbackPopOver = MockNgbPopover;

    component.togglePopover();

    expect(MockNgbPopover.toggle).toHaveBeenCalled();
  });

  it('should close feedback popover', () => {
    component.feedbackPopOver = MockNgbPopover;

    component.closePopover();

    expect(MockNgbPopover.close).toHaveBeenCalled();
  });

  it('should hide attribution modal', () => {
    spyOn(attributionService, 'isAttributionModalShown').and.returnValue(true);
    const hideModalSpy = spyOn(
      attributionService, 'hideAttributionModal').and.callThrough();

    component.toggleAttributionModal();

    expect(hideModalSpy).toHaveBeenCalled();
  });

  it('should show attribution modal', () => {
    spyOn(attributionService, 'isAttributionModalShown').and.returnValue(false);
    const showModalSpy = spyOn(
      attributionService, 'showAttributionModal').and.callThrough();

    component.toggleAttributionModal();

    expect(showModalSpy).toHaveBeenCalled();
  });
});
