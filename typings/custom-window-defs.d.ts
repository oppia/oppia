// Any property defined on window needs to be added here if is not
// present on the type of window.

interface Window {
    HTMLElement: HTMLElement;
    __fixtures__: KarmaFixtures;
    decodeURIComponent: (encodedURIComponent: string) => string;
    encodeURIComponent: (decodedURIComponent: string) => string;
    gtag: Function;
    $: JQueryStatic;
    Base64Binary: Base64Binary;
    jQuery: JQueryStatic;
    dataLayer: object[];
    Guppy: Guppy;
    webkitAudioContext: typeof AudioContext;
}
