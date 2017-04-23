===============
Goals of Bleach
===============

This document lists the goals and non-goals of Bleach. My hope is that by
focusing on these goals and explicitly listing the non-goals, the project will
evolve in a stronger direction.


Goals
=====


Whitelisting
------------

Bleach should always take a whitelist-based approach to allowing any kind of
content or markup. Blacklisting is error-prone and not future proof.

For example, you should have to opt-in to allowing the ``onclick`` attribute,
not blacklist all the other ``on*`` attributes. Future versions of HTML may add
new event handlers, like ``ontouch``, that old blacklists would not prevent.


Sanitizing Input
----------------

The primary goal of Bleach is to sanitize user input that is allowed to contain
*some* HTML as markup and is to be included in the content of a larger page.
Examples might include:

* User comments on a blog.

* "Bio" sections of a user profile.

* Descriptions of a product or application.

These examples, and others, are traditionally prone to security issues like XSS
or other script injection, or annoying issues like unclosed tags and invalid
markup. Bleach will take a proactive, whitelist-only approach to allowing HTML
content, and will use the HTML5 parsing algorithm to handle invalid markup.

See the :ref:`chapter on clean() <clean-chapter>` for more info.


Safely Creating Links
---------------------

The secondary goal of Bleach is to provide a mechanism for finding or altering
links (``<a>`` tags with ``href`` attributes, or things that look like URLs or
email addresses) in text.

While Bleach itself will always operate on a whitelist-based security model,
the :ref:`linkify() method <linkify-chapter>` is flexible enough to allow the
creation, alteration, and removal of links based on an extremely wide range of
use cases.


Non-Goals
=========

Bleach is designed to work with fragments of HTML by untrusted users. Some
non-goal use cases include:

* **Sanitizing complete HTML documents.** Once you're creating whole documents,
  you have to allow so many tags that a blacklist approach (e.g. forbidding
  ``<script>`` or ``<object>``) may be more appropriate.

* **Cleaning up after trusted users.** Bleach is powerful but it is not fast.
  If you trust your users, trust them and don't rely on Bleach to clean up
  their mess.

* **Allowing arbitrary styling.** There are a number of interesting CSS
  properties that can do dangerous things, like Opera's ``-o-link``. Painful as
  it is, if you want your users to be able to change nearly anything in a
  ``style`` attribute, you should have to opt into this.
