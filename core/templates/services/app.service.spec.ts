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
 * @fileoverview Unit tests for the app service.
 */

import { TestBed } from '@angular/core/testing';

import { AppConstants } from 'app.constants';
import { AppService } from 'services/app.service';

describe('App Service', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = TestBed.get(AppService);
  });

  describe('querying the app for Machine Learning classifiers', () => {
    const initialValue = AppConstants.ENABLE_ML_CLASSIFIERS;

    afterAll(() => {
      // This throws "Cannot assign to 'ENABLE_ML_CLASSIFIERS' because it
      // is a read-only property.". We need to suppress this error because
      // we need to change the value of 'ENABLE_ML_CLASSIFIERS' for testing
      // purposes.
      // @ts-expect-error
      AppConstants.ENABLE_ML_CLASSIFIERS = initialValue;
    });

    it('should return true if AppConstants.ENABLE_ML_CLASSIFIERS is true',
      () => {
        // This throws "Cannot assign to 'ENABLE_ML_CLASSIFIERS' because it
        // is a read-only property.". We need to suppress this error because
        // we need to change the value of 'ENABLE_ML_CLASSIFIERS' for testing
        // purposes.
        // @ts-expect-error
        AppConstants.ENABLE_ML_CLASSIFIERS = true;
        expect(appService.isMachineLearningClassificationEnabled()).toBeTrue();
      });

    it('should return false if AppConstants.ENABLE_ML_CLASSIFIERS is false',
      () => {
        // This throws "Cannot assign to 'ENABLE_ML_CLASSIFIERS' because it
        // is a read-only property.". We need to suppress this error because
        // we need to change the value of 'ENABLE_ML_CLASSIFIERS' for testing
        // purposes.
        // @ts-expect-error
        AppConstants.ENABLE_ML_CLASSIFIERS = false;
        expect(appService.isMachineLearningClassificationEnabled()).toBeFalse();
      });
  });
});
