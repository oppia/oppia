// Any property defined on window inside core/tests needs to be added
// here if it is not present on the type of window. This is separate
// from typings/custom-window-defs.d.ts because files under core/tests
// are not included in the main tsconfig and cannot see that file.

interface Window {
  logClick: (clickDetails: {
    position: {x: number; y: number};
    timeInMilliseconds: number;
  }) => void;
}
