#!/bin/bash

virtualenv venv;
source venv/bin/activate;
pip install -r requirements.txt;	

python manage.py test oppia.storage.base_model.test_django \
oppia.storage.image.test_django oppia.storage.parameter.test_django oppia.storage.state.test_django \
oppia.storage.exploration.test_django ;
