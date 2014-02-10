# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""View functions for the authentication app."""

__author__ = 'Tarashish Mishra'

from django.shortcuts import redirect
from django.contrib.auth import logout as auth_logout
from django.core.urlresolvers import reverse


def logout(request):
    """Logs out user"""
    auth_logout(request)
    return redirect('/')


def login(request):
    """login view, redirects to google OpenID auth"""
    if request.user.is_authenticated():
        return redirect('/')
    return redirect(reverse('social:begin', args=['google']))
