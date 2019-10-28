// This definition can be removed once the issue here:
// https://github.com/ckeditor/ckeditor-dev/issues/2947 is resolved.
declare namespace CKEDITOR {
    interface pluginDefinition {
        hidpi?: boolean;
        lang?: string | string[];
        icons?: string;
        requires?: string | string[];

        afterInit?(editor: editor): any;
        beforeInit?(editor: editor): any;
        init?(editor: editor): void;
        isSupportedEnvironment?(editor: editor): Boolean;
        onLoad?(): any;
    }
}
