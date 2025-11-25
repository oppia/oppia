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

**##Project Overview**

Brief description: “Gamification Achievements System for a Learning Portal” that awards badges based on learner activities and shows them on the profile page.​

Problem it solves: low motivation and lack of visual recognition on learning platforms like Oppia.​

Target users: learners, instructors, and platform admins.​

**##Features**
Automatic badge awarding when users complete activities (quiz ≥ 80%, full video, course completion, etc.).​

My Achievements section on user profile with badge grid/cards.​

Badge details modal with description, criteria, date earned, and optional social sharing.​

Optional leaderboard or badge count comparison.​

Badge progression (Bronze/Silver/Gold tiers).​

Achievement statistics (total badges, streaks, recent badges).​

**##Tech Stack**
Frontend: Angular, TypeScript, HTML5, CSS3.​

UI libraries: Angular Material (optional), Bootstrap (optional).​

Data handling: Angular HttpClient, RxJS, LocalStorage/IndexedDB for caching.​

External APIs (optional/for future): Badgr API, UserInfuser, Kahoot API.​

Core Concepts / Architecture
Data models: Badge, Achievement, User (with key fields like id, name, description, criteria, difficultyLevel, earnedDate, etc.).​

Data structures and logic: arrays/lists, maps/dictionaries, filtering, sorting, conditional logic for eligibility.​

Flow: Activity completion → backend checks criteria → creates Achievement record → updates badge count → profile fetches and displays badges → user interacts with badge modal.​

Getting Started
Prerequisites: Node.js, Angular CLI, any backend/mock API setup.​

Installation steps: clone repo, install dependencies, run dev server, configure API base URL for badges/achievements.​

How to run with mock data if real backend is not available.​

Usage Guide
How a learner earns a badge (example flows: quiz, course, video).​

How to view badges on the profile and open badge details.​

How instructors/admins can verify achievements (if applicable).​

Configuration
How to define new badges and criteria (e.g., JSON or TypeScript config).​

How to enable/disable features like leaderboards, notifications, social sharing.​

Screenshots / Demo
Profile page with My Achievements grid.​

Badge details modal.​

Optional: leaderboard/achievement stats dashboard.​

Link to 2–3 minute demo video.​

Testing
Manual test scenarios: quiz badge, course badge, video badge, no duplicate badges.​

Edge cases: user with 0 badges, many badges, missing images, offline activity.​

Performance goals: profile loads in under 2 seconds, badges render correctly.​

Roadmap / Future Work
Deeper integration with Oppia backend APIs.​

More advanced animations for badge unlocks.​

Better error handling and UI/UX polish based on user feedback.​

Project Structure
Describe folders: components, services, models, assets, etc.​

Mention feature branches like feature/gamification-achievement-system if you follow that workflow.​

Contributors & Acknowledgements
Om Ambole and Soham Bhangale, Harshit sir.​



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

## Social Media

[<img height="30" src="https://img.shields.io/badge/twitter-1DA1F2.svg?&style=for-the-badge&logo=twitter&logoColor=white" />][twitter] [<img height="30" src="https://img.shields.io/badge/linkedin-0077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white" />][LinkedIn] [<img height="30" src = "https://img.shields.io/badge/facebook-1877F2.svg?&style=for-the-badge&logo=facebook&logoColor=white">][Facebook] [<img height="30" src = "https://img.shields.io/badge/medium-12100E.svg?&style=for-the-badge&logo=medium&logoColor=white">][medium] [<img height="30" src = "https://img.shields.io/badge/oppia.org%20youtube-FF0000.svg?&style=for-the-badge&logo=youtube&logoColor=white">][oppia-org-youtube] [<img height="30" src = "https://img.shields.io/badge/oppia%20dev%20youtube-FF0000.svg?&style=for-the-badge&logo=youtube&logoColor=white">][dev-youtube]

[twitter]: https://twitter.com/oppiaorg
[linkedIn]: https://www.linkedin.com/company/oppia-org/
[medium]: https://medium.com/@oppia.org
[facebook]: https://www.facebook.com/oppiaorg/
[oppia-org-youtube]: https://www.youtube.com/channel/UC5c1G7BNDCfv1rczcBp9FPw
[dev-youtube]: https://www.youtube.com/channel/UCsrAX-oeqm0-NIQzQrdiUkQ
