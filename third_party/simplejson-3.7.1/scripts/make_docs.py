#!/usr/bin/env python
import os
import subprocess
import shutil

SPHINX_BUILD = 'sphinx-build'

DOCTREES_DIR = 'build/doctrees'
HTML_DIR = 'docs'
for dirname in DOCTREES_DIR, HTML_DIR:
    if not os.path.exists(dirname):
        os.makedirs(dirname)

open(os.path.join(HTML_DIR, '.nojekyll'), 'w').close()
res = subprocess.call([
    SPHINX_BUILD, '-d', DOCTREES_DIR, '-b', 'html', '.', 'docs',
])
raise SystemExit(res)
