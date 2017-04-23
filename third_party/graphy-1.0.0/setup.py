#!/usr/bin/env python

from setuptools import setup

setup(name='Graphy',
        version='1.0.0',
        description='A simple chart library for Python',
        url='http://code.google.com/p/graphy/',
        packages=['graphy', 'graphy.backends', 'graphy.backends.google_chart_api'],
    )
