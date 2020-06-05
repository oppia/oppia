// Any property defined on window needs to be added here if is not
// present on the type of window.

namespace CodeMirror {
    export class MergeView {
      edit?: {
        setValue?: (code: string) => void;
      };
      right?: {
        orig?: {
          setValue?: (code: string) => void;
        }
      };

      constructor(node: Object, options: Object);
    }
}

interface Window {
    CodeMirror?: typeof CodeMirror;
    HTMLElement?: HTMLElement;
    __fixtures__?: KarmaFixtures;
    decodeURIComponent?: (encodedURIComponent: string) => string;
    encodeURIComponent?: (decodedURIComponent: string) => string;
    ga?: Function;
}
