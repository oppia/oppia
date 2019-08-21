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
 * @fileoverview Unit tests for ParamMetadataObjectFactory.
 */

import { ParamMetadata, ParamMetadataObjectFactory } from
  'domain/exploration/ParamMetadataObjectFactory';

describe('ParameterMetadata object factory', () => {
  let parameterMetadata: ParamMetadata = null;
  let pmof: ParamMetadataObjectFactory = null;
  beforeEach(() => {
    pmof = new ParamMetadataObjectFactory();
  });

  it('should have correct metadata for SET action', () => {
    parameterMetadata = pmof.createWithSetAction(
      'answer', 'param_changes', '1');
    expect(parameterMetadata.action).toEqual('set');
    expect(parameterMetadata.paramName).toEqual('answer');
    expect(parameterMetadata.source).toEqual('param_changes');
    expect(parameterMetadata.sourceInd).toEqual('1');
  });

  it('should have correct metadata for GET action', () => {
    parameterMetadata = pmof.createWithGetAction('x', 'content', '5');
    expect(parameterMetadata.action).toEqual('get');
    expect(parameterMetadata.paramName).toEqual('x');
    expect(parameterMetadata.source).toEqual('content');
    expect(parameterMetadata.sourceInd).toEqual('5');
  });
});
