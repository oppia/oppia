// Code - https://github.com/josdejong/mathjs
// This definition can be removed once the issue here:
// https://github.com/josdejong/mathjs/issues/2286 is resolved.

import {MathJsStatic, Unit} from 'mathjs';

interface IUnit extends Unit {
  isValuelessUnit: (unit: string) => boolean;
}

declare module 'mathjs' {
  interface MathJsStatic {
    Unit: IUnit;
  }
}
