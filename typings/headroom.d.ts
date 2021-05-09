
interface Tolerance {
  top: number,
  down: number
}

interface Classes {
  frozen: string,
  pinned: string,
  unpinned: string,
  top: string,
  notTop: string,
  bottom: string,
  notBottom: string,
  initial: string
}

interface HeadroomOptions {
  tolerance: Tolerance,
  offset: number;
  scroller: Window,
  classes: Classes
}

declare class Headroom {
  constructor(element: HTMLElement, options: HeadroomOptions);

  init(): Headroom;
  destory(): void;
  unpin(): void;
  pin(): void;
  freeze(): void;
  unfreeze(): void;
  top(): void;
  notTop(): void;
  bottom(): void;
  notBottom(): void;
  shouldPin(): boolean;
  addClass(): void;
  removeClass(): void;
  hasClass(): boolean;
  update(): void;

  static options: HeadroomOptions;
  cutsTheMustard: boolean;
}

declare module 'headroom.js' {
  export = Headroom;
}
