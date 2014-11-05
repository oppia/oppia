import Cookie
import os
from google.appengine.api import users
from google.appengine.ext import webapp

class LogoutPage(webapp.RequestHandler):
  def get(self):
    target_url = self.request.referer or '/'

    # It seems that AppEngine is setting the ACSID cookie for http:// ,
    # and the SACSID cookie for https:// . We just unset both below.
    cookie = Cookie.SimpleCookie()
    cookie['ACSID'] = ''
    cookie['ACSID']['expires'] = -86400  # In the past, a day ago.
    self.response.headers.add_header(*cookie.output().split(': ', 1))
    cookie = Cookie.SimpleCookie()
    cookie['SACSID'] = ''
    cookie['SACSID']['expires'] = -86400
    self.response.headers.add_header(*cookie.output().split(': ', 1))
    self.redirect(target_url) 
