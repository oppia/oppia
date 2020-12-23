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
 * @fileoverview Module for authentication-related services.
 */

import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';

import { AuthService } from 'services/auth.service';
import { MockAngularFireAuth } from 'tests/unit-test-utils';


describe('Auth service', () => {
  let authService: AuthService;
  let mockAngularFireAuth: MockAngularFireAuth;

  beforeEach(() => {
    mockAngularFireAuth = new MockAngularFireAuth();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {provide: AngularFireAuth, useValue: mockAngularFireAuth},
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('should resolve when sign out succeeds', async() => {
    spyOn(mockAngularFireAuth, 'signOut').and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });

  it('should reject when sign out fails', async() => {
    spyOn(mockAngularFireAuth, 'signOut').and.rejectWith(new Error('fail'));

    await expectAsync(authService.signOutAsync()).toBeRejectedWithError('fail');
  });
});
