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
 * @fileoverview Unit tests for AuthService.
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

    spyOn(angularFireAuth, 'signOut').and.rejectWith(new Error('fail'));

    await expectAsync(authService.signOutAsync()).toBeRejectedWithError('fail');
  });

  it('should unsubscribe from source after calling ngOnDestroy', marbles(m => {
    // AuthService calls .subscribe() on the source ID tokens at "frame 0" of
    // the marble diagrams (represented by the ^ character).
    //
    // We schedule ngOnDestroy() to be called two frames _after_ that (each
    // non-whitespace character of the marble diagram is "1 frame").
    //
    // Given that ngOnDestroy() is supposed to call .unsubscribe() on the source
    // observable, that means the subscription should end (represented by the !
    // character) two frames after the subscription starts.
    //
    // Note that the lifetime of the source tokens are not bounded by the
    // subscription. AuthService simply subscribes, listens for a few frames,
    // and then unsubscribes (because it was destroyed with `.ngOnDestroy()`).
    const sourceIdTokens = m.hot('           --^---');
    const expectedAuthServiceSubscription = '  ^-! ';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);
    m.scheduler.schedule(() => authService.ngOnDestroy(), 2);

    m.expect(sourceIdTokens)
      .toHaveSubscriptions(expectedAuthServiceSubscription);
  }));

  it('should emit null when subscription is too early', marbles(m => {
    // Subscribing to the service's idToken$ emits null for early observers
    // because the source hasn't produced anything yet. The subscription ends
    // before 'a' is emitted, so null is the first and last value observed.
    const sourceIdTokens = m.hot('-----a-');
    const expectedObservations = '-N--   ';
    const givenSubscription = '   -^-!   ';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, givenSubscription)
      .toBeObservable(expectedObservations, {N: null});
  }));

  it('should emit most recent value after subscribing', marbles(m => {
    const sourceIdTokens = m.hot('-a---b---');
    // The early observer will see 'a' and stick around to see 'b' as well.
    const earlyObservations = '   ---a-b---';
    const earlySubscription = '   ---^-----';
    // The late observer will only see 'b'.
    const lateObservations = '    -------b-';
    const lateSubscription = '    -------^-';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, earlySubscription)
      .toBeObservable(earlyObservations);
    m.expect(authService.idToken$, lateSubscription)
      .toBeObservable(lateObservations);
  }));

  it('should emit null when the source errors', marbles(m => {
    // Even though the source emits an error (represented with the # character),
    // the subscriber just observes a null value and continues, rather than
    // ending abruptly from the same error.
    const sourceIdTokens = m.hot('a---#  ');
    const expectedObservations = '--a-N--';
    const givenSubscription = '   --^----';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, givenSubscription)
      .toBeObservable(expectedObservations, {a: 'a', N: null});
  }));

  it('should continue to emit null after the source errors', marbles(m => {
    // The source has closed due to an error, but new subscribers can still
    // register themselves and observe a single null value without ending the
    // stream.
    const sourceIdTokens = m.hot('-#    ');
    const expectedObservations = '---N--';
    const givenSubscription = '   ---^--';

    const [, authService] = setUpSystemUnderTest(sourceIdTokens);

    m.expect(authService.idToken$, givenSubscription)
      .toBeObservable(expectedObservations, {N: null});
  }));
});
