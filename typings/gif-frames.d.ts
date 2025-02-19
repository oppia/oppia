// Declaration file for the 'gif-frames' module.
//  This file declares the module 'gif-frames' so that TypeScript does not throw errors when importing it. The module is treated with an 'any' type.

declare module 'gif-frames' {
  function gifFrames(options: any): Promise<any[]>;
  export = gifFrames;
}
