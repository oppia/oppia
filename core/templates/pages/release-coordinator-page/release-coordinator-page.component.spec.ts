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
 * @fileoverview Unit tests for release coordinator page component.
 */

import {
  TestBed,
  waitForAsync,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormBuilder} from '@angular/forms';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA, ElementRef} from '@angular/core';

import {PromoBarBackendApiService} from 'services/promo-bar-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {
  ReleaseCoordinatorBackendApiService,
  UserGroupsResponse,
} from './services/release-coordinator-backend-api.service';
import {ReleaseCoordinatorPageConstants} from 'pages/release-coordinator-page/release-coordinator-page.constants';
import {ReleaseCoordinatorPageComponent} from 'pages/release-coordinator-page/release-coordinator-page.component';
import {UserGroup} from 'domain/release_coordinator/user-group.model';
import {PromoBar} from 'domain/promo_bar/promo-bar.model';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash',
    },
    open() {
      return;
    },
  };
}

describe('Release coordinator page', () => {
  let component: ReleaseCoordinatorPageComponent;
  let fixture: ComponentFixture<ReleaseCoordinatorPageComponent>;
  let pbbas: PromoBarBackendApiService;
  let rcbas: ReleaseCoordinatorBackendApiService;
  let confirmSpy: jasmine.Spy;
  let ngbModal: NgbModal;
  let mockWindowRef: MockWindowRef;

  let testPromoBarData = new PromoBar(true, 'Hello');
  let testMemoryCacheProfile = {
    peak_allocation: '1430120',
    total_allocation: '1014112',
    total_keys_stored: '2',
  };

  const userGroupData: UserGroupsResponse = {
    userGroups: [
      UserGroup.createFromBackendDict({
        user_group_id: 'userGroupId1',
        name: 'UserGroup1',
        member_usernames: ['User1', 'User2', 'User3'],
      }),
      UserGroup.createFromBackendDict({
        user_group_id: 'userGroupId2',
        name: 'UserGroup2',
        member_usernames: ['User4', 'User5'],
      }),
      UserGroup.createFromBackendDict({
        user_group_id: 'userGroupId3',
        name: 'UserGroup3',
        member_usernames: ['User6', 'User7', 'User8'],
      }),
      UserGroup.createFromBackendDict({
        user_group_id: 'userGroupId9',
        name: 'UserGroup9',
        member_usernames: ['User12', 'User13'],
      }),
    ],
  };

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ReleaseCoordinatorPageComponent],
      providers: [
        PromoBarBackendApiService,
        ReleaseCoordinatorBackendApiService,
        FormBuilder,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleaseCoordinatorPageComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    pbbas = TestBed.inject(PromoBarBackendApiService);
    rcbas = TestBed.inject(ReleaseCoordinatorBackendApiService);
  });

  beforeEach(() => {
    spyOn(pbbas, 'getPromoBarDataAsync').and.returnValue(
      Promise.resolve(testPromoBarData)
    );
    spyOn(rcbas, 'getUserGroupsAsync').and.returnValue(
      Promise.resolve(userGroupData)
    );
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
    component.ngOnInit();
  });

  it(
    'should load the component with the correct properties' +
      'when user navigates to release coordinator page',
    fakeAsync(() => {
      expect(component.statusMessage).toEqual('');
      expect(component.submitButtonDisabled).toBeTrue();
      expect(component.memoryCacheDataFetched).toBeFalse();
      expect(component.activeTab).toEqual(
        ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS
      );

      tick();

      expect(pbbas.getPromoBarDataAsync).toHaveBeenCalled();
      expect(component.promoBarConfigForm.enabled).toBeTrue();
    })
  );

  it('should update promo bar parameter and set success status', fakeAsync(() => {
    spyOn(pbbas, 'updatePromoBarDataAsync').and.returnValue(Promise.resolve());

    component.updatePromoBarParameter();

    expect(component.statusMessage).toEqual(
      'Updating promo-bar platform parameter...'
    );

    tick();

    expect(pbbas.updatePromoBarDataAsync).toHaveBeenCalled();
    expect(component.statusMessage).toEqual('Success!');
  }));

  it('should set error status when update promo bar parameter fails', fakeAsync(() => {
    spyOn(pbbas, 'updatePromoBarDataAsync').and.returnValue(
      Promise.reject('failed to update')
    );

    component.updatePromoBarParameter();

    expect(component.statusMessage).toEqual(
      'Updating promo-bar platform parameter...'
    );

    tick();

    expect(pbbas.updatePromoBarDataAsync).toHaveBeenCalled();
    expect(component.statusMessage).toEqual('Server error: failed to update');
  }));

  it('should flush memory cache and set success status', fakeAsync(() => {
    spyOn(rcbas, 'flushMemoryCacheAsync').and.returnValue(Promise.resolve());

    component.flushMemoryCache();
    tick();

    expect(rcbas.flushMemoryCacheAsync).toHaveBeenCalled();
    expect(component.statusMessage).toEqual('Success! Memory Cache Flushed.');
    expect(component.memoryCacheDataFetched).toBeFalse();
  }));

  it('should set error status when failed to flush memory cache', fakeAsync(() => {
    spyOn(rcbas, 'flushMemoryCacheAsync').and.returnValue(
      Promise.reject('failed to flush')
    );

    component.flushMemoryCache();
    tick();

    expect(rcbas.flushMemoryCacheAsync).toHaveBeenCalled();
    expect(component.statusMessage).toEqual('Server error: failed to flush');
  }));

  it('should fetch memory cache profile and set success status', fakeAsync(() => {
    spyOn(rcbas, 'getMemoryCacheProfileAsync').and.returnValue(
      Promise.resolve(testMemoryCacheProfile)
    );

    component.getMemoryCacheProfile();
    tick();

    expect(rcbas.getMemoryCacheProfileAsync).toHaveBeenCalled();
    expect(component.memoryCacheProfile.totalAllocatedInBytes).toEqual(
      testMemoryCacheProfile.total_allocation
    );
    expect(component.memoryCacheProfile.peakAllocatedInBytes).toEqual(
      testMemoryCacheProfile.peak_allocation
    );
    expect(component.memoryCacheProfile.totalKeysStored).toEqual(
      testMemoryCacheProfile.total_keys_stored
    );
    expect(component.memoryCacheDataFetched).toBeTrue();
    expect(component.statusMessage).toBe('Success!');
  }));

  it('should set error status when fetching memory cache profile fails', fakeAsync(() => {
    spyOn(rcbas, 'getMemoryCacheProfileAsync').and.returnValue(
      Promise.reject('failed to fetch')
    );

    component.getMemoryCacheProfile();
    tick();

    expect(rcbas.getMemoryCacheProfileAsync).toHaveBeenCalled();
    expect(component.statusMessage).toBe('Server error: failed to fetch');
  }));

  describe('user groups', () => {
    it('should load user groups on init', fakeAsync(() => {
      expect(component.userGroups.length > 0).toBeFalse();

      component.ngOnInit();
      tick();

      component.onUserGroupUserInputChange();
      component.onUserGroupInputChange();

      expect(component.userGroups.length > 0).toBeTrue();
      expect(component.userInUserGroupValidationError).toEqual('');
      expect(component.userGroupValidationError).toEqual('');
    }));

    it('should set user group in edit mode', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.userGroupInEditMode).toBeFalse();
      component.setUserGroupInEditMode();
      expect(component.userGroupInEditMode).toBeTrue();
    }));

    describe('when clicking on save button to update user group', () => {
      it('should be same when no changes are present', fakeAsync(() => {
        component.ngOnInit();
        tick();

        expect(component.userGroups[0].memberUsernames).toEqual([
          'User1',
          'User2',
          'User3',
        ]);
        component.updateUserGroup(component.userGroups[0]);
        expect(component.userGroups[0].memberUsernames).toEqual([
          'User1',
          'User2',
          'User3',
        ]);
      }));

      it('should not update user group name when it already exists', fakeAsync(() => {
        component.ngOnInit();
        tick();

        expect(component.userGroups[0].name).toEqual('UserGroup1');
        component.userGroups[0].name = 'UserGroup2';
        component.updateUserGroup(component.userGroups[0]);
        expect(component.userGroups[0].name).toEqual('UserGroup1');
        expect(component.userGroupSaveError).toEqual(
          "User group with name 'UserGroup2' already exist."
        );
      }));

      it('should not update user group name if does not follow regex', fakeAsync(() => {
        component.ngOnInit();
        tick();

        expect(component.userGroups[0].name).toEqual('UserGroup1');
        component.userGroups[0].name = 'User_Group_1';
        component.updateUserGroup(component.userGroups[0]);
        expect(component.userGroups[0].name).toEqual('UserGroup1');
        expect(component.userGroupSaveError).toEqual(
          'User group name can only contain alphanumeric characters and spaces.'
        );
      }));

      it('should not update user group name when it is empty string', fakeAsync(() => {
        component.ngOnInit();
        tick();

        expect(component.userGroups[0].name).toEqual('UserGroup1');
        component.userGroups[0].name = '';
        component.updateUserGroup(component.userGroups[0]);
        expect(component.userGroups[0].name).toEqual('UserGroup1');
        expect(component.userGroupSaveError).toEqual(
          'User group name should not be empty.'
        );
      }));

      it('should not update if cancel button is clicked in the alert', fakeAsync(() => {
        component.ngOnInit();
        tick();
        confirmSpy.and.returnValue(false);
        let updateUserGroupSpy = spyOn(rcbas, 'updateUserGroupAsync');
        component.userInputToAddUserToGroup = {
          nativeElement: {
            value: '',
          },
        } as ElementRef;

        component.addUserToUserGroup(
          {value: 'User10'},
          component.userGroups[0]
        );
        component.updateUserGroup(component.userGroups[0]);
        tick();

        expect(updateUserGroupSpy).not.toHaveBeenCalled();
        component.removeUserFromUserGroup(component.userGroups[0], 'User10');
      }));

      it('should update the user groups', fakeAsync(() => {
        component.ngOnInit();
        tick();

        confirmSpy.and.returnValue(true);
        let updateUserGroupSpy = spyOn(
          rcbas,
          'updateUserGroupAsync'
        ).and.resolveTo();

        component.userGroups[0].name = 'UserGroup5';
        component.updateUserGroup(component.userGroups[0]);
        tick();

        expect(updateUserGroupSpy).toHaveBeenCalled();
        expect(component.statusMessage).toBe(
          "User group 'UserGroup5' successfully updated."
        );
        component.userGroups[0].name = 'UserGroup1';
        component.updateUserGroup(component.userGroups[0]);
      }));

      it('should not update in case of backend error', fakeAsync(() => {
        component.ngOnInit();
        tick();

        confirmSpy.and.returnValue(true);
        let updateUserGroupSpy = spyOn(
          rcbas,
          'updateUserGroupAsync'
        ).and.rejectWith('Internal Server Error.');
        component.userInputToAddUserToGroup = {
          nativeElement: {
            value: '',
          },
        } as ElementRef;

        component.addUserToUserGroup(
          {value: 'User10'},
          component.userGroups[0]
        );
        component.updateUserGroup(component.userGroups[0]);
        tick();

        expect(updateUserGroupSpy).toHaveBeenCalled();
        expect(component.userGroupSaveError).toBe('Internal Server Error.');
        component.removeUserFromUserGroup(component.userGroups[0], 'User10');
      }));
    });

    describe('when resetting the edited user group', () => {
      it('should do nothing when no changes present', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.resetUserGroup(component.userGroups[0]);

        expect(confirmSpy).not.toHaveBeenCalled();
      }));

      it('should reset the changes when requested', fakeAsync(() => {
        component.ngOnInit();
        tick();
        confirmSpy.and.returnValue(true);

        expect(component.userGroups[0].name).toEqual('UserGroup1');
        component.userGroups[0].name = 'UserGroup5';
        component.resetUserGroup(component.userGroups[0]);
        expect(component.userGroups[0].name).toEqual('UserGroup1');
      }));

      it('should not reset the changes when canceled', fakeAsync(() => {
        component.ngOnInit();
        tick();
        confirmSpy.and.returnValue(false);
        component.userInputToAddUserToGroup = {
          nativeElement: {
            value: '',
          },
        } as ElementRef;

        component.addUserToUserGroup(
          {value: 'User10'},
          component.userGroups[0]
        );
        component.resetUserGroup(component.userGroups[0]);
        expect(
          component.userGroups[0].memberUsernames.includes('User10')
        ).toBeTrue();

        component.removeUserFromUserGroup(component.userGroups[0], 'User10');
      }));
    });

    describe('when adding a new user to specified user group', () => {
      it('should not save when username is empty string', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.addUserToUserGroup({value: ''}, 'UserGroup1');

        expect(
          component.userGroups[0].memberUsernames.includes('')
        ).toBeFalse();
      }));

      it('should save the new user', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.userInputToAddUserToGroup = {
          nativeElement: {
            value: '',
          },
        } as ElementRef;

        expect(
          component.userGroups[0].memberUsernames.includes('User11')
        ).toBeFalse();
        component.addUserToUserGroup(
          {value: 'User11'},
          component.userGroups[0]
        );
        expect(
          component.userGroups[0].memberUsernames.includes('User11')
        ).toBeTrue();

        component.removeUserFromUserGroup(component.userGroups[0], 'User11');
      }));

      it('should not add the user if it already exists', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.userInputToAddUserToGroup = {
          nativeElement: {
            value: '',
          },
        } as ElementRef;

        expect(component.userInUserGroupValidationError.length > 0).toBeFalse();
        component.addUserToUserGroup({value: 'User1'}, component.userGroups[0]);
        expect(component.userInUserGroupValidationError.length > 0).toBeTrue();
      }));
    });

    it('should remove the selected user group when requested', fakeAsync(() => {
      component.ngOnInit();
      tick();

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve(),
      } as NgbModalRef);
      spyOn(rcbas, 'deleteUserGroupAsync').and.returnValue(Promise.resolve());
      component.deleteUserGroup('userGroupId3');
      tick();

      expect(
        component.userGroups.some(
          userGroup => userGroup.userGroupId === 'userGroupId3'
        )
      ).toBeFalse();
    }));

    it('should not be removed when clicked on cancel button', fakeAsync(() => {
      component.ngOnInit();
      tick();

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {},
        result: Promise.reject(),
      } as NgbModalRef);
      spyOn(rcbas, 'deleteUserGroupAsync').and.returnValue(Promise.resolve());
      component.deleteUserGroup('userGroupId1');

      expect(
        component.userGroups.some(userGroup => userGroup.name === 'UserGroup1')
      ).toBeTrue();
    }));

    it('should set error message when user group not found', fakeAsync(() => {
      component.ngOnInit();
      tick();

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve(),
      } as NgbModalRef);
      component.deleteUserGroup('userGroupId10');

      expect(
        component.userGroups.some(
          userGroup => userGroup.userGroupId === 'UserGroup10'
        )
      ).toBeFalse();
      expect(component.statusMessage).toBe(
        "User group with id 'userGroupId10' not found."
      );
    }));

    it('should not be removed in case of backend error', fakeAsync(() => {
      component.ngOnInit();
      tick();

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve(),
      } as NgbModalRef);
      let deleteUserGroupSpy = spyOn(
        rcbas,
        'deleteUserGroupAsync'
      ).and.rejectWith('Internal Server Error.');

      component.deleteUserGroup('userGroupId1');
      tick();

      expect(deleteUserGroupSpy).toHaveBeenCalled();
      expect(
        component.userGroups.some(userGroup => userGroup.name === 'UserGroup1')
      ).toBeTrue();
      expect(component.statusMessage).toBe(
        'Server error: Internal Server Error.'
      );
    }));

    it('should remove user from user group when requested', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.removeUserFromUserGroup(component.userGroups[1], 'User5');

      expect(
        component.userGroups[1].memberUsernames.includes('User5')
      ).toBeFalse();
    }));

    it('should toggle the user group detail section', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(
        component.userGroupIdsToDetailsShowRecord.userGroupId1
      ).toBeFalse();
      component.toggleUserGroupDetailsSection('userGroupId1');
      expect(component.userGroupIdsToDetailsShowRecord.userGroupId1).toBeTrue();

      component.toggleUserGroupDetailsSection('userGroupId1');
    }));

    it(
      'should display error when trying to toggle other user ' +
        'group in edit mode',
      fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.toggleUserGroupDetailsSection('userGroupId1');
        component.setUserGroupInEditMode();
        component.toggleUserGroupDetailsSection('userGroupId2');

        expect(component.userGroupSaveError.length > 0).toBeTrue();
      })
    );

    describe('when adding a new user group', () => {
      it('should not update when user group already exists', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.newUserGroupName = 'UserGroup1';
        component.addUserGroup();

        expect(component.userGroupValidationError.length > 0).toBeTrue();
      }));

      it('should not add new user group when name fails the regex', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.newUserGroupName = 'User_Group_1';
        component.addUserGroup();

        expect(component.userGroupValidationError.length > 0).toBeTrue();
      }));

      it('should not update when the given user group is empty string', fakeAsync(() => {
        component.ngOnInit();
        tick();

        component.newUserGroupName = '';
        component.addUserGroup();

        expect(
          component.userGroups.some(userGroup => userGroup.name === '')
        ).toBeFalse();
      }));

      it('should update the user groups', fakeAsync(() => {
        component.ngOnInit();
        tick();
        const userGroup = UserGroup.createFromBackendDict({
          user_group_id: 'userGroupId8',
          name: 'UserGroup8',
          member_usernames: [],
        });
        spyOn(rcbas, 'createUserGroupAsync').and.returnValue(
          Promise.resolve(userGroup)
        );

        component.newUserGroupName = 'UserGroup8';
        component.addUserGroup();
        tick();

        expect(
          component.userGroups.some(
            userGroup => userGroup.name === 'UserGroup8'
          )
        ).toBeTrue();
      }));

      it('should fail in case of backend error', fakeAsync(() => {
        component.ngOnInit();
        tick();

        let updateUserGroupSpy = spyOn(
          rcbas,
          'createUserGroupAsync'
        ).and.rejectWith('Internal Server Error.');

        component.newUserGroupName = 'UserGroup10';
        component.addUserGroup();
        tick();

        expect(updateUserGroupSpy).toHaveBeenCalled();
        expect(
          component.userGroups.some(
            userGroup => userGroup.name === 'UserGroup10'
          )
        ).toBeFalse();
        expect(component.statusMessage).toBe(
          'Server error: Internal Server Error.'
        );
      }));
    });

    it('should throw error when user group backup not found', fakeAsync(() => {
      component.ngOnInit();
      tick();

      const userGroup = UserGroup.createFromBackendDict({
        user_group_id: 'randomUserGroupId',
        name: 'random_user_group',
        users: ['user', 'testuser'],
      });

      expect(() => {
        component.isUserGroupUpdated(userGroup);
      }).toThrowError();
    }));
  });
});
