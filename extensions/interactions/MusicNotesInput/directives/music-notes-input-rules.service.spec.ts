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

import { MusicNotesInputRulesService } from
  'interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import { UtilsService } from 'services/utils.service';

describe('Music Notes Input rules service', () => {
  let mnirs: MusicNotesInputRulesService;
  beforeEach(() => {
    mnirs = new MusicNotesInputRulesService(new UtilsService());
  });

  it('should return the MIDI Note value when called', () => {
    let note = {
      readableNoteName: 'A5',
      noteDuration: {
        num: 1,
        den: 1
      }
    };
    expect(MusicNotesInputRulesService._getMidiNoteValue(note)).toBe(81);
  });

  it('should throw error if a invalid note is passed', () => {
    let note = {
      readableNoteName: 'Z5',
      noteDuration: {
        num: 1,
        den: 1
      }
    };
    expect(() => {
      MusicNotesInputRulesService._getMidiNoteValue(note);
    }).toThrowError('Invalid music note [object Object]');
  });
  it('should have a correct \'equals\' rule', () => {
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

  it('should have a correct \'equal except for\' rule', () => {
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

  it('should have a correct \'is transposition of\' rule', () => {
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
    () => {
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
  it('should have a correct \'is longer than\' rule', () => {
    expect(mnirs.IsLongerThan([{
      readableNoteName: 'A4',
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
    }], {
      k: 1
    })).toBe(true);

    expect(mnirs.IsLongerThan([{
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
      k: 5
    })).toBe(false);
  });
  it('should have a correct \'has length inclusively between\' rule',
    () => {
      expect(mnirs.HasLengthInclusivelyBetween([{
        readableNoteName: 'A4',
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
      }], {
        a: 1,
        b: 3
      })).toBe(true);

      expect(mnirs.HasLengthInclusivelyBetween([{
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
        a: 5,
        b: 10
      })).toBe(false);
    });
});
