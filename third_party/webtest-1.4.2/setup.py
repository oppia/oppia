#!/usr/bin/env python

import sys

from setuptools import setup
from setuptools import find_packages

version = '1.4.2'

tests_require = ['nose', 'coverage']

if sys.version_info[0] == 2:
    tests_require.append('unittest2')
else:
    tests_require.append('unittest2py3k')


setup(name='WebTest',
      version=version,
      description="Helper to test WSGI applications",
      long_description=open('README.rst').read(),
      classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Framework :: Paste",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Topic :: Internet :: WWW/HTTP :: WSGI",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Server",
        "Programming Language :: Python :: 2.5",
        "Programming Language :: Python :: 2.6",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
      ],
      keywords='wsgi test unit tests web',
      author='Ian Bicking',
      author_email='ianb at colorstudy com',
      maintainer='Gael Pasgrimaud',
      maintainer_email='gael@gawel.org',
      url='http://webtest.pythonpaste.org/',
      license='MIT',
      packages=find_packages(exclude=[
          'ez_setup',
          'examples',
          'tests',
          'bootstrap',
          'bootstrap-py3k',
      ]),
      include_package_data=True,
      zip_safe=False,
      install_requires=[
        'WebOb',
      ],
      test_suite='nose.collector',
      tests_require=tests_require,
      extras_require={
            'tests': tests_require,
      },
      entry_points="""
      [paste.app_factory]
      debug = webtest.debugapp:make_debug_app
      """,
      )
