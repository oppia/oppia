// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Music Notes rules.
 */

describe('Music Notes Input rules service', function() {
  beforeEach(module('oppia'));

  var mnirs = null;
  beforeEach(inject(function($injector) {
    mnirs = $injector.get('MusicNotesInputRulesService');
  }));

  it('should have a correct \'equals\' rule', function() {
    expect(mnirs.Equals([{
      readableNoteName: 'A4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }]
    })).toBe(true);

    expect(mnirs.Equals([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'D4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'D4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }]
    })).toBe(true);

    expect(mnirs.Equals([{
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }]
    })).toBe(false);

    expect(mnirs.Equals([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'D4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'F4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'D4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }]
    })).toBe(false);
  });

  it('should have a correct \'equal except for\' rule', function() {
    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 1
    })).toBe(true);

    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'A4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 1
    })).toBe(true);

    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }
    ], {
      x: [{
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 2
    })).toBe(false);

    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 1
    })).toBe(false);

    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 1
    })).toBe(false);

    expect(mnirs.IsEqualToExceptFor([{
      readableNoteName: 'G4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'D4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }
    ], {
      x: [{
        readableNoteName: 'F4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'D4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'G5',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      k: 2
    })).toBe(false);
  });

  it('should have a correct \'is transposition of\' rule', function() {
    expect(mnirs.IsTranspositionOf([{
      readableNoteName: 'G4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }
    ], {
      x: [{
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      y: 7
    })).toBe(true);

    expect(mnirs.IsTranspositionOf([{
      readableNoteName: 'F4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'A4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      y: -2
    })).toBe(true);

    expect(mnirs.IsTranspositionOf([{
      readableNoteName: 'G4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }, {
      readableNoteName: 'B4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      y: 3
    })).toBe(false);

    expect(mnirs.IsTranspositionOf([{
      readableNoteName: 'C4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }], {
      x: [{
        readableNoteName: 'F4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }],
      y: 1
    })).toBe(false);
  });

  it('should have a correct \'is transposition of except for\' rule',
    function() {
      expect(mnirs.IsTranspositionOfExceptFor([{
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'B4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'E4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }], {
        x: [{
          readableNoteName: 'C4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'E4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'G4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }],
        y: 7,
        k: 1
      })).toBe(true);

      expect(mnirs.IsTranspositionOfExceptFor([{
        readableNoteName: 'F4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'D5',
        noteDuration: {
          num: 1,
          den: 1
        }
      }], {
        x: [{
          readableNoteName: 'G4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'B4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'D5',
          noteDuration: {
            num: 1,
            den: 1
          }
        }],
        y: -2,
        k: 1
      })).toBe(true);

      expect(mnirs.IsTranspositionOfExceptFor([{
        readableNoteName: 'G4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }, {
        readableNoteName: 'A4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }], {
        x: [{
          readableNoteName: 'E4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'G4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'B4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }],
        y: 3,
        k: 1
      })).toBe(false);

      expect(mnirs.IsTranspositionOfExceptFor([{
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }], {
        x: [{
          readableNoteName: 'F4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }, {
          readableNoteName: 'B4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }],
        y: 1,
        k: 1
      })).toBe(false);
    }
  );
});
