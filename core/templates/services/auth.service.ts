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

import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private tokenCache: BehaviorSubject<string | null>;
  private tokenSubscription: Subscription;

  constructor(private angularFireAuth: AngularFireAuth) {
    this.tokenCache = new BehaviorSubject(null);
    this.tokenSubscription = this.angularFireAuth.idToken.pipe(
      catchError(_ => of(null))).subscribe(this.tokenCache);
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
