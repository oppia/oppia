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
 * @fileoverview Service for managing the authorizations of logged-in users.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private tokenCache: BehaviorSubject<string | null>;
  private tokenSubscription: Subscription;

  constructor(private angularFireAuth: AngularFireAuth) {
    // An Observable (i.e. stream of values) Subject (i.e. producer of values).
    // BehaviorSubjects are "cold" observables (i.e. lazy streams that only emit
    // values when prompted by a subscriber), and emits the value it last
    // produced to new subscribers (or null, the initial value we've given it).
    this.tokenCache = new BehaviorSubject(null);
    // Object used to control the lifetime of a subscription. After the
    // subscription becomes obsolete, we should call ".unsubscribe()" on it to
    // prevent a memory leak.
    this.tokenSubscription = (
      // Given an untrusted source of ID Tokens, prepare to apply a sequence of
      // transformations on the values it emits using a "pipe".
      this.angularFireAuth.idToken.pipe(
        // Catch errors thrown by the untrusted source and change them into a
        // "cold" Observable that eternally emits "null".
        catchError(_ => new BehaviorSubject(null)))
        // Subscribe to the results, forwarding every token (or null) it emits
        // into our BehaviorSubject.
        .subscribe(this.tokenCache));
  }

  ngOnDestroy(): void {
    this.tokenSubscription.unsubscribe();
  }

  get idToken$(): Observable<string | null> {
    return this.tokenCache.asObservable();
  }

  async signOutAsync(): Promise<void> {
    return this.angularFireAuth.signOut();
  }
}
