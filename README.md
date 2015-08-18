# Oppia
Oppia is an online learning tool that enables anyone to easily create and share interactive activities. These activities, called 'explorations', simulate a one-on-one conversation with an intelligent tutor. You can try a hosted version at [Oppia.org](https://www.oppia.org), and read more at our [GitHub page](http://oppia.github.io/).

## Installation
Please refer to https://code.google.com/p/oppia/wiki/GettingStarted for extensive installation instructions. Here is just a short summary for developers who would like to contribute:

1. First, fork and clone the Oppia repo. We suggest you make a directory called opensource/ within your home folder (mkdir opensource). Then do

  ```
    cd opensource/
  ```

  and follow the instructions on Github's [Fork a Repo page](https://help.github.com/articles/fork-a-repo/) to clone the repo to that directory. This should create a new folder named `oppia`.

2. Navigate to `oppia/` and install Oppia by running

  ```
    bash scripts/start.sh
  ```

3. To test the installation, navigate to `oppia/` and run

  ```
    bash scripts/test.sh
    bash scripts/run_js_tests.sh
  ```

# Contributing

We welcome new contributors! Please see the [CONTRIBUTING](CONTRIBUTING.md) file for instructions on how to contribute code to Oppia.
