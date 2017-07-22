NG-AUDIO
===

The Angular Audio Module

Installation: `bower install angular-audio`

Development Instructions
------
1. Clone Git Repo
2. Install dependencies with `npm install; bower install`;
3. Install Gulp with `npm install -g gulp`;
4. Run dev environment with `gulp`;

Deployment
-----
To deploy to `gh-pages`, call `gulp deploy`;

Total awesomeness for playing sounds. Project page here:

##[Angular Audio Project Page](http://danielstern.github.io/ngAudio/)
##[Angular Audio Documentation](http://danielstern.github.io/ngAudio/#/docs)


Release Notes v1.7.4

- Updated Angular dependency to support 1.6.x

Release Notes v1.7.3

- Add toFinish callback

Release Notes v1.7.2

- Updated Angular dependency to support 1.5.x

Release Notes v1.7.1

- Fixed https://github.com/danielstern/ngAudio/issues/85

Release Notes v1.7.0

- Add trackTime filter
- Add disablePreload option
- Fixed bug where performance could not be changed after sound was loaded
- Updated bower file and dependencies to use Bower for development environment deps using devDependencies
- Added longer song in examles
- automate to github page deploy
- add stuff to Readme

Release Notes v1.6.2
-------
- add hover support
- update gh-pages

Release Notes v1.5.0
-------
- add playback rate supprt

Release Notes v1.4.2
-------
- add unlock boolean to disable unlocking if desired
- added performance var to let user tweak performance


Release Notes v1.4.0
-------
- several bug fixes. update version numbers

Release Notes v1.3.0
-------
- fixes audio on most mobile devices

Release Notes v1.2.1
-------
- removed depencency on bootstrap, jquery and ui-router
- fix 0 volume bug

Release Notes v1.2
-------

- added unbind() which improves performance but loses read functionality
- reduced file size
- reduced interval cycle

Release Notes v1.0
---------
- Not backwards compatible with previous version. please check out the [Angular Audio Docs](http://danielstern.github.io/ngAudio/#/docs) since this is pretty much completely different
- for previous version check out branch *v0.9*

License
-------
<a href=http://opensource.org/licenses/MIT target=_blank>
The MIT License
</a>

<a  href=http://danielstern.ca/ target=_blank>
Copyright (c) daniel stern, Azureda
</a>
