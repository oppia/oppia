// Using angular without declaration gives the following error:
// 'angular' refers to a UMD global, but the current file is a module.
// Consider adding an import instead. To fix this, we need to mark
// angular as a global. Ref: https://stackoverflow.com/a/42035067
declare global {
  const angular: ng.IAngularStatic;

  interface Window {
    // eslint-disable-next-line oppia/disallow-flags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diff_match_patch: any;
    DIFF_DELETE: number;
    DIFF_EQUAL: number;
    DIFF_INSERT: number;
  }
}
export {};
