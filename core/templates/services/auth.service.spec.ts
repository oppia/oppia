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
import { of } from 'rxjs';
import { marbles } from 'rxjs-marbles';

import { AuthService } from 'services/auth.service';
import { MockAngularFireAuth } from 'tests/unit-test-utils';



describe('Auth service', () => {
  const setUpSystemUnderTest = (
      idTokenSource$ = of(null)): [AngularFireAuth, AuthService] => {
    const mockAngularFireAuth = new MockAngularFireAuth(idTokenSource$);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {provide: AngularFireAuth, useValue: mockAngularFireAuth},
      ]
    });

    return [TestBed.inject(AngularFireAuth), TestBed.inject(AuthService)];
  };

  it('should resolve when sign out succeeds', async() => {
    const [angularFireAuth, authService] = setUpSystemUnderTest();

    spyOn(angularFireAuth, 'signOut').and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });

  it('should reject when sign out fails', async() => {
    const [angularFireAuth, authService] = setUpSystemUnderTest();

    spyOn(angularFireAuth, 'signOut').and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });

  it('should unsubscribe from source after calling ngOnDestroy', marbles(m => {
    const sourceIdTokens = m.hot('   ^---');
    const authServiceSubscription = '^-! ';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);
    // Calls ngOnDestroy() after 2 frames have elapsed in the marble diagram.
    // Frame 0 begins at the ^ character, so we check for an unsubscription (by
    // using the ! character) 2 frames after it.
    m.scheduler.schedule(() => authService.ngOnDestroy(), 2);

    m.expect(sourceIdTokens).toHaveSubscriptions(authServiceSubscription);
  }));

  it('should emit null when subscription is too early', marbles(m => {
    // Subscribing to the service's idToken$ emits null for the early observer
    // because the source hasn't produced anything yet. The subscription ends
    // before 'a' is emitted, so null is the first and last value observed.
    const sourceIdTokens = m.hot('-----a-|');
    const expectedObservations = '-N--    ';
    const givenSubscription = '   -^-!    ';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, givenSubscription)
      .toBeObservable(expectedObservations, {N: null});
  }));

  it('should emit most recent value after subscribing', marbles(m => {
    const sourceIdTokens = m.hot('-a---b---|');
    // The early observer will see 'a' and stick around to see 'b' as well.
    const earlyObservations = '   ---a-b----';
    const earlySubscription = '   ---^-----!';
    // The late observer will only see 'b'.
    const lateObservations = '    -------b--';
    const lateSubscription = '    -------^-!';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, earlySubscription)
      .toBeObservable(earlyObservations);
    m.expect(authService.idToken$, lateSubscription)
      .toBeObservable(lateObservations);
  }));

  it('should emit null and complete after source errors', marbles(m => {
    // Subscriber joins in time to observe 'a' and then completes after emitting
    // a final null value, rather than throwing the error from source.
    const sourceIdTokens = m.hot('a---#   ');
    const expectedObservations = '--a-(N|)';
    const givenSubscription = '   --^--   ';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, givenSubscription)
      .toBeObservable(expectedObservations, {a: 'a', N: null});
  }));
});
