# -*- coding: utf-8 -*-

import os
import sys

dir_ = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, dir_)
sys.path.insert(0, os.path.abspath(os.path.join(dir_, "..")))

needs_sphinx = "1.3"

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.extlinks',
]
intersphinx_mapping = {
    'python': ('https://docs.python.org/2.7', None),
    'python3': ('https://docs.python.org/3.5', None),
}
source_suffix = '.rst'
master_doc = 'index'
project = 'mutagen'
copyright = u'2016, Joe Wreschnig, Michael Urman, Lukáš Lalinský, ' \
            u'Christoph Reiter, Ben Ockmore & others'
html_title = project
exclude_patterns = ['_build']

extlinks = {
    'bug': ('https://github.com/quodlibet/mutagen/issues/%s', '#'),
    'pr': ('https://github.com/quodlibet/mutagen/pull/%s', '#pr'),
    'commit': ('https://github.com/quodlibet/mutagen/commit/%s', '#'),
    'user': ('https://github.com/%s', ''),
}


autodoc_member_order = "bysource"
default_role = "obj"

html_theme = "sphinx_rtd_theme"
html_favicon = "images/favicon.ico"
html_theme_options = {
    "display_version": False,
}

html_context = {
    'extra_css_files': [
        '_static/extra.css',
    ],
}

html_static_path = [
    "extra.css",
]
