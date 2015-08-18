# Oppia
Oppia is an online learning tool that enables anyone to easily create and share interactive activities. These activities, called 'explorations', simulate a one-on-one conversation with an intelligent tutor. You can try a hosted version at [Oppia.org](https://www.oppia.org), and read more at our [GitHub page](http://oppia.github.io/).

## Installation

Please refer to the [developer wiki](https://github.com/oppia/oppia/wiki) for extensive installation instructions. This is a short summary for developers who would like to contribute:

1. First, create a new, empty folder called `opensource/` within your home folder. (Note that the Oppia installation process will, later, add other folders to `opensource`.)

2. Navigate to this folder (`cd opensource`), then fork and clone the Oppia repo to it by following the instructions on Github's [Fork a Repo page](https://help.github.com/articles/fork-a-repo/). This will create a new folder named `opensource/oppia`.

3. To install the development version of Oppia, navigate to `opensource/oppia/` and run:

  ```
    git checkout develop
    bash scripts/start.sh
  ```

4. To test the installation, run:

  ```
    bash scripts/test.sh
    bash scripts/run_js_tests.sh
  ```

# Contributing

We welcome new contributors! Please see the [CONTRIBUTING](CONTRIBUTING.md) file for instructions on how to contribute code to Oppia.
