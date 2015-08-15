# Oppia
Oppia is an online learning tool that enables anyone to easily create and share interactive activities. These activities, called 'explorations', simulate a one-on-one conversation with an intelligent tutor. You can try a hosted version at Oppia.org.

## Bite-Size
Explorations are easy to create and quick to play. They can be published in the exploration gallery, shared on social media, or embedded on your webpage.

## Interactive
Oppia supports 'learning by doing'. Your exploration can include embedded code editors, dynamic world maps, and many other options for interaction.

## Adaptive
Feedback is an essential part of learning. The branching nature of Oppia allows you to respond to mistakes and address misconceptions as learners progress through an exploration.

Oppia is free and open source software. It is released under the Apache License 2.0.


## Features
* Each exploration simulates a 1-on-1 interactive conversation with a tutor.
* Targeted feedback can be given to learners based on their respective answers.
* Explorations can be embedded in any webpage.
* Analytics dashboards highlight common problems and allow explorations to be improved over time.
* Learners can leave feedback on explorations for the authors to address.
* Explorations can be easily customized using a rich online editor.
* Each exploration comes with a full version history.
* Multiple authors can collaborate on an exploration.
* Explorations are playable on mobile devices (except for some of the more complex interactions).
* Parameters can be used to create a richer, more personalized experience.
* Oppia's comprehensive extension framework allows straightforward integration of new interactions and classification rules.

## INSTALLATION

Please refer to https://code.google.com/p/oppia/wiki/GettingStarted for extensive installation instructions. Here is just a short summary for developers who would like to contribute:

First, clone the Oppia repo. We suggest you make a directory called opensource/ within your home folder (mkdir opensource). Then do

```
     cd opensource/
```

and inside there, follow the instructions at the bottom of this page

```
    https://code.google.com/p/oppia/source/clones
```

Clone the GitHub repo to your own computer.

```
    git clone git@github.com:oppia/oppia.git
```

You might have to change the name of the downloaded directory to oppia,

```
    mv [YOUR_REPO_NAME] oppia
```

Then, navigate to oppia/ and install Oppia with

```
    bash scripts/start.sh
```

## TESTING THE INSTALLATION

Run `bash scripts/test.sh' and `bash scripts/run_js_tests.sh' from the oppia/ folder.
