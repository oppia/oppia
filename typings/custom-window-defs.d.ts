// Any property defined on window needs to be added here if is not
// present on the type of window.

interface Window {
  HTMLElement: HTMLElement;
  __fixtures__: KarmaFixtures;
  decodeURIComponent: (encodedURIComponent: string) => string;
  encodeURIComponent: (decodedURIComponent: string) => string;
  logClick: (clickDetails: {
    position: {x: number; y: number};
    timeInMilliseconds: number;
  }) => void;
  gtag: Function;
  Base64Binary: Base64Binary;
  dataLayer: object[];
  Guppy: Guppy;
  webkitAudioContext: typeof AudioContext;
}
