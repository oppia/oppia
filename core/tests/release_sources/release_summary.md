## Collected release information

### Feconf version changes:
This indicates that a migration may be needed

* CURRENT_STATE_SCHEMA_VERSION

### Changed setup scripts:
* scripts/install_third_party.sh
* scripts/setup.sh
* scripts/install_third_party.py

### Changed storage models:
* core/storage/base_model/gae_models.py
* core/storage/base_model/gae_models_test.py
* core/storage/classifier/gae_models_test.py
* core/storage/collection/gae_models.py
* core/storage/collection/gae_models_test.py
* core/storage/email/gae_models_test.py
* core/storage/exploration/gae_models.py
* core/storage/exploration/gae_models_test.py
* core/storage/feedback/gae_models_test.py
* core/storage/file/gae_models.py
* core/storage/file/gae_models_test.py
* core/storage/question/gae_models.py
* core/storage/question/gae_models_test.py
* core/storage/statistics/gae_models_test.py
* core/storage/story/gae_models.py
* core/storage/story/gae_models_test.py
* core/storage/user/gae_models_test.py

### New Authors:
* Alice <alice@gmail.com>
* Bob <bob@gmail.com>
* Casie <casie@gmail.com>
* Quent <qunet@outlook.com>
* Zoe <zoe@gmail.com>

### Existing Authors:
* Akshay Anand <akshayanand681@gmail.com>
* Amey <amey-kudari@gmail.com>
* Ankita Saxena <ankitasonu24@gmail.com>
* Anubhav Sinha <anubhavsinha98@gmail.com>
* Apurv Bajaj <apurvabajaj007@gmail.com>

### New Contributors:
* Alice <alice@gmail.com>
* Bob <bob@gmail.com>
* Quent <qunet@outlook.com>
* Zoe <zoe@gmail.com>

### Email C&P Blurbs about authors:
``Please welcome Alexandra Wu, Anish V Badri, MLA98, Nisheal John, and mertdeg2 for whom this release marks their first contribution to Oppia!``

``Thanks to Akshay Anand, Amey, Ankita Saxena, Anubhav Sinha, Apurv Bajaj, Brian Rodriguez, Eric Lou, James James, Kevin Lee, Mohammad Zaman, Nisheal John, Nithesh N. Hariharan, Nitish Bansal, Rishabh Rawat, Rishav Chakraborty, Sandeep Dubey, Sean Lip, Sean Lip, Shiqi Wu, Shitong Shou, Vibhor Agarwal, Vinita Murthi, Vojtěch Jelínek, and Yash Jipkate, our returning contributors who made this release possible.``

### Changelog:
Bug fixes
* Fix #7007: Allows adding proper tags for the exploration by replacing parent with ctrl (#7058)
* Fix #6864: Fix console error in learner dashboard and empty suggestion modal (#7056)
* Fix #7031: Add missing $ctrl (#7032)

Statistics
* Adding a LearnerAnswerDetailsModel (#6815)

Improvements to editors and players
* Fix part of #5799: Feedback card object factory (#7076)
* Frontend changes such that creator can enable/disable solicit answer details feature for a state (#6926)
* Fix #6792: Adding Exploration Titles to Collection Landing Page (#6881)


### Commit History:
* Changed parent to ctrl in stettings tab. (#7058)
* Fix #6864: Fix console error in learner dashboard and empty suggestion modal (#7056)
* Add missing ctrl (#7032)

### Issues mentioned in commits:
* [https://github.com/oppia/oppia/issues/6955](https://github.com/oppia/oppia/issues/6955)
* [https://github.com/oppia/oppia/issues/6954](https://github.com/oppia/oppia/issues/6954)
