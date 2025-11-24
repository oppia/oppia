# [Oppia](https://www.oppia.org) [![Full-stack tests](https://github.com/oppia/oppia/actions/workflows/full_stack_tests.yml/badge.svg)](https://github.com/oppia/oppia/actions/workflows/full_stack_tests.yml)

Oppia is an online learning tool that enables anyone to easily create and share interactive activities (called 'explorations'). These activities simulate a one-on-one conversation with a tutor, enabling students to learn by doing while getting feedback.

In addition to developing the Oppia platform, the team has developed free and effective [lessons](https://www.oppia.org/fractions) on basic mathematics, and we are planning to expand our educational offering to basic science and financial literacy. These lessons help learners who lack appropriate access to educational resources.

The Oppia web application is built using Python, Angular, and Google App Engine. See also:

- [Oppia.org community site](https://www.oppia.org)
- [User Documentation](https://oppia.github.io/)
- [Contributors' wiki](https://github.com/oppia/oppia/wiki)
- [GitHub Discussions](https://github.com/oppia/oppia/discussions)
- [File an issue](https://github.com/oppia/oppia/issues/new/choose)

You can also sign up to our [email newsletter](https://shorturl.at/CHPY6) for news and updates about the Oppia project.

<p align="center">
  <a href="http://www.youtube.com/watch?v=Ntcw0H0hwPU" target="_blank" rel="noopener">
    <img src="https://user-images.githubusercontent.com/30050862/228266651-1270bedc-658a-40d8-8ab4-16b63de4deaf.png">
  </a>
</p>

## Installation

Please refer to the [Installing Oppia page](https://github.com/oppia/oppia/wiki/Installing-Oppia) for full instructions.

## Contributing

The Oppia project is built by the community for the community. We welcome contributions from everyone, especially new contributors.

You can help with Oppia's development in many ways, including art, coding, design and documentation.

- **Developers**: please see [this wiki page](https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia#setting-things-up) for instructions on how to set things up and commit changes.
- **All other contributors**: please see our [general contributor guidelines](https://github.com/oppia/oppia/wiki).

If you'd like to donate to support our work, you can do so [here](https://www.oppia.org/donate).

## Support

If you have any feature requests or bug reports, please log them on our [issue tracker](https://github.com/oppia/oppia/issues/new/choose).

Please report security issues directly to admin@oppia.org.

## License

The Oppia code is released under the [Apache v2 license](https://github.com/oppia/oppia/blob/develop/LICENSE).

## Keeping in touch

- [Discussion forum](https://github.com/oppia/oppia/discussions)
- [Announcements mailing list](http://groups.google.com/group/oppia-announce)

## Contributing

- **[Fix learner dashboard goals test to verify Completed Goals and Add Goal sections](https://github.com/oppia/oppia/pull/23652) (Merged Nov 3, 2025)**  
  Improves acceptance tests for the learner dashboard Goals section, adding verification for "Completed Goals" visibility and the "Add a Goal" button, essential for tracking learner progress.
This PR strengthened the automated acceptance tests for the Goals feature in the learner dashboard, a core part of my OJT project’s gamification and learner progress tracking system. It introduced helper methods that verify visibility of the Completed Goals section and the Add a Goal button, ensuring these UI elements function correctly according to the new designs we implemented. This testing update supports quality assurance and validates the effectiveness of the newly developed dashboard features without impacting user-facing performance.



- **[Add “New” label in Learner Dashboard and redesigned related pages](https://github.com/oppia/oppia/pull/23576) (Merged Oct 19, 2025)**  
  This introduced a “New” label highlighting recently published chapters, redesigned dashboard and topic viewer pages, and fixed bugs related to chapter recommendations in my project area.
As part of enhancing learner engagement in my project, this PR implemented a “New” label for recently published chapters on both the learner dashboard and topic viewer pages. The feature highlights fresh content, making it easier and more intuitive for learners to access updated lessons, thereby boosting interactivity within the platform. Additionally, this PR fixed bugs affecting chapter recommendations and streamlined the learner’s content discovery experience, including UI improvements and frontend test coverage specific to my project module.



- **[Fix bug with serial chapter feature leakage and related topic viewer fixes](https://github.com/oppia/oppia/pull/23178)**  
  Fixes bugs in serial chapter feature flags and improved chapter display logic, stabilizing key learner dashboard components.
This PR addressed bugs within the chapter recommendation and visibility system critical to my OJT project’s scope. It resolved serial chapter feature leakage issues where feature flags incorrectly persisted, causing inaccurate chapter displays and learner confusion. This contribution improved the logic for “Coming Soon” labels and the continue-where-you-left-off list, stabilizing the learner dashboard functionality that I helped build and maintain.


## Social Media

[<img height="30" src="https://img.shields.io/badge/twitter-1DA1F2.svg?&style=for-the-badge&logo=twitter&logoColor=white" />][twitter] [<img height="30" src="https://img.shields.io/badge/linkedin-0077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white" />][LinkedIn] [<img height="30" src = "https://img.shields.io/badge/facebook-1877F2.svg?&style=for-the-badge&logo=facebook&logoColor=white">][Facebook] [<img height="30" src = "https://img.shields.io/badge/medium-12100E.svg?&style=for-the-badge&logo=medium&logoColor=white">][medium] [<img height="30" src = "https://img.shields.io/badge/oppia.org%20youtube-FF0000.svg?&style=for-the-badge&logo=youtube&logoColor=white">][oppia-org-youtube] [<img height="30" src = "https://img.shields.io/badge/oppia%20dev%20youtube-FF0000.svg?&style=for-the-badge&logo=youtube&logoColor=white">][dev-youtube]

[twitter]: https://twitter.com/oppiaorg
[linkedIn]: https://www.linkedin.com/company/oppia-org/
[medium]: https://medium.com/@oppia.org
[facebook]: https://www.facebook.com/oppiaorg/
[oppia-org-youtube]: https://www.youtube.com/channel/UC5c1G7BNDCfv1rczcBp9FPw
[dev-youtube]: https://www.youtube.com/channel/UCsrAX-oeqm0-NIQzQrdiUkQ
