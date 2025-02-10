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
 * @fileoverview Unit tests for loader service.
 */

import {LoaderService} from 'services/loader.service';
import {Subscription} from 'rxjs';

describe('Loader Service', () => {
  const loaderService = new LoaderService();
  let loadingMessage: string = '';
  let subscriptions: Subscription;
  beforeEach(() => {
    subscriptions = new Subscription();
    subscriptions.add(
      loaderService.onLoadingMessageChange.subscribe(
        (message: string) => (loadingMessage = message)
      )
    );
  });

  afterEach(() => {
    subscriptions.unsubscribe();
  });

  it('should set the loading message', () => {
    loaderService.showLoadingScreen('Loading');
    expect(loadingMessage).toBe('Loading');
  });

  it('should set the loading message to empty quotes when unset', () => {
    loaderService.hideLoadingScreen();
    expect(loadingMessage).toBe('');
  });
});
