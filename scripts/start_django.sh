#!/bin/bash

bash scripts/django_testrunner.sh;
source venv/bin/activate;
python manage.py syncdb
python main.py;
