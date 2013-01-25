# Copyright 2012 Google Inc. All Rights Reserved.
# Author: Sean Lip

"""Stores various configuration options for Oppia."""

import os

# Whether to unconditionally log info messages.
DEBUG = False

# Whether we are running in production mode.
PRODUCTION_MODE = False

# Whether we should serve the development or production experience.
DEV = (os.environ.get('SERVER_SOFTWARE')
       and os.environ['SERVER_SOFTWARE'].startswith('Development')
       and not PRODUCTION_MODE)

# The directory containing the HTML/JS/CSS templates.
TEMPLATE_DIR = ('templates/dev/head/' if DEV
                else 'templates/prod/head/')

