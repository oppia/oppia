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
 * @fileoverview Tests for ReplaceInputsWithEllipses pipe for Oppia.
 */

import { ReplaceInputsWithEllipsesPipe } from
  'filters/string-utility-filters/replace-inputs-with-ellipses.pipe';

describe('Testing filters', function() {
  let pipe: ReplaceInputsWithEllipsesPipe;
  beforeEach(() => {
    pipe = new ReplaceInputsWithEllipsesPipe();
  });

  it('should have all expected filters', () => {
    expect(pipe).not.toEqual(null);
  });

  it('should convert {{...}} tags to ...', () => {
    expect(pipe.transform('')).toEqual('');
    // Use unknown type conversion to check input invalidity.
    expect(pipe.transform(null as unknown as string)).toEqual('');
    // Use unknown type conversion to check input invalidity.
    expect(pipe.transform(undefined as unknown as string)).toEqual('');
    expect(pipe.transform('hello')).toEqual('hello');
    expect(pipe.transform('{{hello}}')).toEqual('...');
    expect(pipe.transform('{{hello}} and {{goodbye}}')).toEqual('... and ...');
    expect(pipe.transform('{{}}{{hello}}')).toEqual('{{}}...');
  });
});
