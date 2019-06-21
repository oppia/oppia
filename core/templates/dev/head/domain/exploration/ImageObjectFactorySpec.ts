// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Image object factory.
 */

require('domain/exploration/WImageObjectFactory.ts');

describe('Image object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('ImageObjectFactory', function() {
    var iof = null;
    var image = null

    beforeEach(angular.mock.inject(function($injector) {
        iof = $injector.get('ImageObjectFactory');
        image = iof.createFromBackendDict({
            src: '',
            placeholder: false,
            instructions: ''
        });
     }));

    it('should get and set value correctly', function() {
        expect(image).toEqual(iof.createFromBackendDict({
            src: '',
            placeholder: false,
            instructions: ''
        }));
    });

  });
});