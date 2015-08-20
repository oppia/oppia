# Oppia

Oppia is an online learning tool that enables anyone to easily create and share interactive activities (called 'explorations'). These activities simulate a one-on-one conversation with a tutor, making it possible for students to learn by doing and get feedback.

For full user documentation, see our [GitHub page](http://oppia.github.io/). You can also create explorations on the community site at [Oppia.org](https://www.oppia.org).


## Installation

Please refer to the [developer wiki](https://github.com/oppia/oppia/wiki) for extensive installation instructions. This is a short summary for developers who would like to contribute:

1. Create a new, empty folder called `opensource/` within your home folder. (Note that the Oppia installation process will add other folders to `opensource`.)

2. Navigate to this folder (`cd opensource`), then [fork and clone](https://help.github.com/articles/fork-a-repo/) the Oppia repo. This will create a new folder named `opensource/oppia`.

3. Navigate to `opensource/oppia/` and run:

  ```
    git checkout develop
    bash scripts/start.sh
  ```

4. To test the installation, run:

  ```
    bash scripts/test.sh
    bash scripts/run_js_tests.sh
    bash scripts/run_integration_tests.sh
  ```


## Contributing

The Oppia project is built by the community for the community, and is currently in active development. 

We love contributions. There are many ways to help with Oppia's development, including art, coding, design and documentation. New contributors are always welcome!

If you'd like to help with code-related stuff, please see the [CONTRIBUTING](CONTRIBUTING.md) file for instructions. We'll add instructions for helping with other types of things soon -- but, if you're interested in any of these, please send an email to `admin@oppia.org`, and we'll get back to you promptly!


## Support

If you have any feature requests or bug reports, please log them on our [issue tracker](https://github.com/oppia/oppia/issues/new?title=Describe%20your%20feature%20request%20or%20bug%20report%20succinctly&body=If%20you%27d%20like%20to%20propose%20a%20feature,%20describe%20what%20you%27d%20like%20to%20see.%20Mock%20ups%20would%20be%20great!%0A%0AIf%20you%27re%20reporting%20a%20bug,%20please%20be%20sure%20to%20include%20the%20expected%20behaviour,%20the%20observed%20behaviour,%20and%20steps%20to%20reproduce%20the%20problem.%20Console%20copy-pastes%20and%20any%20background%20on%20the%20environment%20would%20also%20be%20helpful.%0A%0AThanks!).


## License

The Oppia code is released under the [Apache v2 license](https://github.com/oppia/oppia/blob/master/LICENSE).
