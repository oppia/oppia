TESTING INSTRUCTIONS
--------------------

This folder contains embedding scripts for Oppia explorations, and tests for
them. To load the examples manually you need to:

- Load the 'Welcome' demo exploration (with id '0') for version 0.0.0 and
  the 'protractor_test_1' exploration (with id '12') for other versions
  on a local development server.
- Change the content of the initial state to anything you like. Change also the
  language to one of the supported site languages. This changes the exploration
  to version 2.
- In a browser window, open each of the HTML files in this folder, and ensure
  that they do the correct thing. Use URLs of the following form:

      http://localhost:8181/assets/scripts/embedding_tests_dev_0.0.2.min.html


The features supported in each version of the embedding script are as follows:

- v0.0.0: simple embedding; embedding a particular version of an exploration;
    embedding with event hooks.
- v0.0.1: simple embedding; embedding a particular version of an exploration;
    embedding with event hooks; embedding with delayed loading and a 'load'
    button.
- v0.0.2: simple embedding; embedding a particular version of an exploration;
    embedding with event hooks.
- v0.0.3: simple embedding; embedding a particular version of an exploration;
    embedding with event hooks; access exploration title on load.

