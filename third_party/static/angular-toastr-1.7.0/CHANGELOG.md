# Changelog

## Version 1.7.0

- `toastr` service has an `active()` method to get all the opened toasts.

## Version 1.6.0

- onTap callback receives the whole toast as the first parameter.
- onShown callback receives the whole toast as the first parameter.
- onHidden callback receives the whole toast as the second parameter.

## Version 1.5.0

- Fix an issue where `maxOpened` with 2 or more was conflicting with `autoDismiss`.
- Fix that when you try to close an undefined toast it won't close them all.
- Toasts should be now more accessible.
- You can now pass custom data to templates, useful for custom templates
- New callback, `onTap` which is called when you click a toast (doesn't have to be closed for it to work).
- Fix `onHidden` to have the `wasClicked` parameter to true when using a toast close button.

## Version 1.4.1

- Fix a typo on the toastr.less file that prevented some automated tools to work.
- Add the license to bower.json.

## Version 1.4.0

- With `preventOpenDuplicates` you can prevent duplicates of opened toasts.
- Webpack / Browserify support.
- Now the bower package won't try to fetch the latest angular version.

## Version 1.3.1

- Add compatibility with `Angular 1.4.x`.

## Version 1.3.0

- An `autoDismiss` option to be used with `maxOpened` to dismiss the oldest toast.
- Every toast has now an `isOpened` property to see whether they are opened or not.

## Version 1.2.1

- Remove a nasty console.log from the progress bar (yikes!).

## Version 1.2.0

- Support for a progress bar.
- A config option to change the path of the templates.

**BREAKING CHANGE:**

If you were using a custom template using the default path, it changed from:

`templates/toastr/toastr.html`

to

`directives/toast/toast.html`

## Version 1.1.0

- Now you can prevent the last toast from being duplicated setting `preventDuplicates` to true.
- Fix toasts options not working if the title parameter is set to null.
- Prevent toasts to override global options.

## Version 1.0.2

- Fixed an issue where it wouldn't work anymore without `ngAnimate`.

## Version 1.0.1

- Hotfix for npm package.

## Version 1.0.0

- No changes since last beta

## Version 1.0.0-beta.3

- Be able to specify a concrete target for container.
- Using $injector internally to avoid circular dependencies.
- onHidden receives a parameter to see whether a toast was closed by timeout or click.
- Fix an issue with toasts not closing up.

## Version 1.0.0-beta.2

- Fix maxOpened. Now toasts are queued when the max is reached.

## Version 1.0.0-beta.1

- Maximum opened toasts can be limited now.
- Allows to attach an `onShown` and `onHidden` callback.
- Allows toasts to override options without title [9013c4d](https://github.com/Foxandxss/angular-toastr/commit/9013c4d1c7562d2ba5047c1e969a0316eb4e6c1d)

## Version 0.5.2

- Removed the support for IE 8 (in terms of CSS)
- Changed `$timeout` to `$interval` so protractor tests won't fail.

## Version 0.5.1

- newestOnTop, with that you can choose whether to add new toasts on the top or bottom. Top by default.

## Version 0.5.0

- Angular 1.3.x support

## Version 0.4.0

- You can add HTML on the toastr titles.
- You can now override the toast's template.
- Fix issue using toastr with ionic.

## Version 0.3.0

- Now the toasts supports a close button.
- Be able to disable to close on click.

## Version 0.2.4

- Fixes #2 where a toast could remain open for all eternity.

## Version 0.2.0

- You can make an sticky toast if you set the `timeOut` to 0. If you also set `extendedTimeOut` to 0 the sticky won't go away until you click on them.
- Toasts accept custom HTML into them!

## Version 0.1.2

- Animations are now optional
- Removed the possibility to add the toast container where you want to (that will be back in a future)

## Version 0.1.1

- The `close` method has been renamed to `clear` to match the original API

## Version 0.1.0

- Initial release
