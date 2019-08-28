// Using angular without declaration gives the following error:
// 'angular' refers to a UMD global, but the current file is a module.
// Consider adding an import instead. To fix this, we need to mark
// angular as a global. Ref: https://stackoverflow.com/a/42035067
declare global {
  const angular: ng.IAngularStatic;
}
export {};
