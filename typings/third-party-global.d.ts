declare var MathJax: any;
declare var gtag: any;

declare namespace google {
  namespace visualization {
    class PieChart {
      constructor(element: any);
      draw(data: any, options?: any): void;
    }
    function arrayToDataTable(data: any): any;
  }
  namespace charts {
    function setOnLoadCallback(callback: Function): void;
  }
}

interface Window {
  MathJax: any;
  CKEDITOR_BASEPATH: string;
}

declare namespace CKEDITOR {
  export type sharedSpace = any;
  export const sharedSpace: any;

  export const POSITION_AFTER_END: any;
  export const plugins: any;
  export function inline(element: any, config?: any): any;

  export interface config {
    extraPlugins?: string;
    startupFocus?: boolean;
    removePlugins?: string;
    title?: boolean;
    floatSpaceDockedOffsetY?: number;
    extraAllowedContent?: string;
    forcePasteAsPlainText?: boolean;
    sharedSpaces?: any;
    skin?: string;
    toolbar?: any;
    format_tags?: string;
    format_heading?: any;
    format_normal?: any;
    language?: string;
    contentsLanguage?: string;
    contentsLangDirection?: string;
  }

  export namespace config {
    export type styleObject = any;
  }

  export interface editor {
    [key: string]: any;
  }

  export namespace htmlParser {
    export interface element {
      setHtml(html: string): void;
      name: string;
    }
  }

  export namespace dom {
    export interface element {
      [key: string]: any;
      getChild(index: number): any;
    }
  }
}
