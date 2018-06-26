// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Unit tests for ConceptCardObjectFactory.
*/

describe('Concept card object factory', function() {
  beforeEach(module('oppia'));

  describe('ConceptCardObjectFactory', function() {
    var ConceptCardObjectFactory;
    var conceptCardDict = {
      explanation: 'test explanation',
      worked_examples: ['worked example 1', 'worked example 2']
    };
    beforeEach(inject(function($injector) {
      ConceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');

      it('should create a new concept card from a backend dictionary',
        function() {
          var conceptCard =
            ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
          expect(conceptCard.getExplanation()).toEqual('test explanation');
          expect(conceptCard.getWorkedExamples()).toEqual(
            ['worked example 1', 'worked example 2']);
        });

      it('should convert to a backend dictionary', function() {
        var conceptCard =
          ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
        expect(conceptCard.toBackendDict()).toEqual(conceptCardDict);
      });
    }));
  });
});
