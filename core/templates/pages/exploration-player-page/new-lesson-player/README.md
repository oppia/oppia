# 🧩 New Lesson Player Components

This folder contains all necessary components for the proper functioning of the **New Lesson Player**.

---

## ❓ What is the "New Lesson Player"?

The **New Lesson Player** is a redesigned and modernized version of the interface that learners use to play lessons (explorations). It aims to enhance:

- 🎯 **User experience and accessibility**
- 📱 **Responsiveness** on mobile devices
- 🧱 **Code maintainability and modularity**

This effort likely involves a complete **rearchitecture** of the frontend components and services that power the lesson-viewing experience.

---

## 🔍 How to Check Its Current Status

Follow the development and rollout progress through:

**GitHub Issue:** [#19217](https://github.com/oppia/oppia/issues/19217)

This issue includes:

- 📅 A full **milestone table**
- 🎯 **Target dates** for key feature completions
- ✅ **Details** on completed functionality

---

## 🧪 How to Test It

To test the **New Lesson Player**, follow these steps:

1. ✅ **Enable** the `new_lesson_player` flag from the **Release Coordinator** page.
2. ▶️ **Open any lesson** using one of the following methods:

   - 📄 **Manually change the URL** from `/explore` to `/lesson`
     - **Example:**  
       Change `http://localhost:8081/explore/6`  
       to `http://localhost:8081/lesson/6`
   - 📘 **Click on a lesson card** or navigate via the regular UI

3. 🔁 **All `/explore/:id` links will automatically redirect** to `/lesson/:id` when the feature flag is enabled.
   - This ensures you don't need to manually adjust URLs during normal navigation.

> 💡 Whether you arrive via URL or UI, you'll be routed to the new lesson player if the flag is on.

---

## 📂 Sub-directories

1. `/sidebar-component`  
   Contains all files required for the **sidebar UI** and its associated functionalities.

2. `/conversation-skin-components`  
   Includes components related to the **conversation skin**, such as:

   - Supplemental card
   - Input-response
   - Hints
   - Concept card
   - Solution

   i. `/Progress-tracker`  
    Manages **checkpoint functionality**, **progress-saving**, and **celebration pop-ups**.

   ii. `/conversation-display`  
    Contains logic and components for displaying and managing the **conversation interface**.

3. `/lesson-header`  
   Contains logic and components required for displaying and managing the **lesson header** information.

---

## 🔄 How Is `conversation-skin` Different from `conversation-display`?

The `conversation-skin-components` folder contains the **entire set of components** that make up the **lesson-playing interface**. This includes not just the learner's interaction area but also supporting UI elements like:

- 🎧 **Audiobar**
- 🧭 **Navigation controls**
- 📈 **Progress tracker**
- 💡 **Hints, solutions, and concept cards**

It serves as the **outer shell** that orchestrates the full learner experience.

On the other hand, the `conversation-display` sub-directory is focused **only** on rendering and managing the **core dialogue experience**, including:

- 🗣️ **Question and prompt display**
- ✍️ **Learner input**
- 💬 **Feedback and response handling**

> 🧩 **In summary:**  
> `conversation-skin` = full UI shell for the lesson player  
> `conversation-display` = core dialogue and response interface

📄 For a visual breakdown, refer to this diagram:  
 [Conversation Skin Architecture Diagram](https://docs.google.com/document/d/1bSxUBZQjlZ1fiMQwKhgVBiQSmDCPhE8xjoGP0ZouY4c/edit?tab=t.0#bookmark=kix.oyxsgpve86wj)
