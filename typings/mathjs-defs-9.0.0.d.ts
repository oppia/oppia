// Code - https://github.com/josdejong/mathjs
// This definition can be removed once the issue here:
// https://github.com/josdejong/mathjs/issues/2286 is resolved.

import {MathJsStatic, Unit} from 'mathjs';

interface UnitComponent {
  power: number;
  prefix: UnitPrefix;
  unit: {
    name: string;
    base: {
      dimensions: number[];
      key: string;
    };
    prefixes: Record<string, UnitPrefix>;
    value: number;
    offset: number;
    dimensions: number[];
  };
}

interface UnitPrefix {
  name: string;
  value: number;
  scientific: boolean;
}

interface Prefix {
  name: string;
  value: number;
  scientific: boolean;
}

interface PrefixSet {
  [key: string]: Prefix;
}

interface Prefixes {
  [key: string]: PrefixSet;
}

interface IUnit extends Unit {
  isValuelessUnit: (unit: string) => boolean;
  PREFIXES: Prefixes;
}

declare module 'mathjs' {
  interface MathJsStatic {
    Unit: IUnit;
  }

  interface Unit {
    units: UnitComponent[];
  }
}
