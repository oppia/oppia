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
 * @fileoverview Unit tests for CreateActivityModalComponent.
 */

import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from
  '@angular/core/testing';
import { ExplorationCreationService } from 'components/entity-creation-services/exploration-creation.service';
import { CollectionCreationService } from 'components/entity-creation-services/collection-creation.service';
import { CreateActivityModalComponent } from './create-activity-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockActiveModal {
  dismiss(): void {}
}

class MockExplorationCreationService {
  createNewExploration(): void {}
}

class MockCollectionCreationService {
  createNewCollection(): void {}
}

describe('Create Activity Modal Component', () =>{
  let component: CreateActivityModalComponent;
  let fixture: ComponentFixture<CreateActivityModalComponent>;
  let collectionCreationService: CollectionCreationService;
  let explorationCreationService: ExplorationCreationService;
  let ngbActiveModal: NgbActiveModal;
  let userService: UserService;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CreateActivityModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal },
        {
          provide: ExplorationCreationService,
          useClass: MockExplorationCreationService
        },
        { provide: CollectionCreationService,
          useClass: MockCollectionCreationService
        }
      ]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(
        CreateActivityModalComponent);
      component = fixture.componentInstance;
    });
    ngbActiveModal = TestBed.get(NgbActiveModal);
    explorationCreationService = TestBed.get(ExplorationCreationService);
    collectionCreationService = TestBed.get(CollectionCreationService);
    userService = TestBed.get(UserService);
  }));

  afterEach(() => {
    // This will destroy the fixture once the test gone end
    // this is going to makesure that each testcase is going
    // to run independent of another test case.
    fixture.destroy();
  });

  it('should evalute component properties after component is initialized',
    fakeAsync(() => {
      const UserInfoObject = {
        roles: ['USER_ROLE'],
        is_moderator: false,
        is_curriculum_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        email: 'test@test.com',
        user_is_logged_in: true
      };
      spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
        UserInfo.createFromBackendDict(UserInfoObject))
      );
      component.ngOnInit();
      flushMicrotasks();
      expect(component.canCreateCollections).toBeTrue();
      expect(component.getStaticImageUrl('/activity/exploration.svg'))
        .toBe('/assets/images/activity/exploration.svg');
      expect(component.getStaticImageUrl('/activity/collection.svg'))
        .toBe('/assets/images/activity/collection.svg');
    }));

  it('should create new exploration when choosing exploration as the new' +
    ' activity', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    spyOn(explorationCreationService, 'createNewExploration').and.callThrough();
    component.chooseExploration();
    expect(explorationCreationService.createNewExploration).toHaveBeenCalled();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should create new collection when choosing collection as the new' +
    ' activity', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    spyOn(collectionCreationService, 'createNewCollection').and.callThrough();
    component.chooseCollection();
    expect(collectionCreationService.createNewCollection).toHaveBeenCalled();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
