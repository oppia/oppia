TESTING INSTRUCTIONS

This folder contains a few folder with source files representative of Oppia's
repository to provide a deterministic test environment, that never changes,
for build testing.

- Changes, such as file deletion, file renaming, ...etc, to contents inside
  core/tests/build_sources/assets, core/tests/build_sources/extensions, and
  core/tests/build_sources/templates will affect test cases in build_test.py.

- Processed, minified or built files should go to core/tests/build.

- core/tests/build should be clean out at the end of each test run to prevent
  adding new files to the directory.
