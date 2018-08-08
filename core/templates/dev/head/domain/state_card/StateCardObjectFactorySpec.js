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
 * @fileoverview Tests for StateCardObjectFactory.
 */

describe('State card object factory', function() {
  var StateCardObjectFactory = null;
  var _sampleCard = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    StateCardObjectFactory = $injector.get('StateCardObjectFactory');

    _sampleCard = StateCardObjectFactory.createNewCard(
      'State 1', {}, '<p>Content</p>', '<interaction></interaction>', false);
  }));

  it('should be able to get the various fields', function() {
    expect(_sampleCard.getStateName()).toEqual('State 1');
    expect(_sampleCard.getCurrentParams()).toEqual({});
    expect(_sampleCard.getContentHtml()).toEqual('<p>Content</p>');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction></interaction>');
    expect(_sampleCard.getInputResponsePairs()).toEqual([]);
    expect(_sampleCard.getDestStateName()).toEqual(null);
    expect(_sampleCard.getLeadsToConceptCard()).toEqual(false);

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response'
    });

    expect(_sampleCard.getOppiaResponse(0)).toEqual('response');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response');
    expect(_sampleCard.getLastInputResponsePair()).toEqual({
      oppiaResponse: 'response'
    });
  });

  it('should add input response pair', function() {
    _sampleCard.addInputResponsePair('pair 1');
    expect(_sampleCard.getInputResponsePairs()).toEqual(['pair 1']);
  });

  it('should be able to set the various fields', function() {
    _sampleCard.setInteractionHtml('<interaction_2></interaction_2>');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction_2></interaction_2>');
    _sampleCard.setDestStateName('state 2');
    expect(_sampleCard.getDestStateName()).toEqual('state 2');
    _sampleCard.setLeadsToConceptCard(true);
    expect(_sampleCard.getLeadsToConceptCard()).toEqual(true);

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response'
    });
    _sampleCard.setOppiaResponse(0, 'response_2');
    expect(_sampleCard.getOppiaResponse(0)).toEqual('response_2');

    _sampleCard.setLastOppiaResponse('response_3');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response_3');
  });
});
