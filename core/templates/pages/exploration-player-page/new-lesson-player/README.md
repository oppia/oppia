# 🧩 New Lesson Player Components

This folder contains all necessary components for the proper functioning of the **New Lesson Player**.

---

## ❓ What is the "New Lesson Player"?

The **New Lesson Player** is a redesigned and modernized version of the interface that learners use to go through lessons (explorations). It aims to enhance:

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
2. ▶️ **Open any lesson** in the player.
3. 🌐 **Change the URL** from `/explore` to `/lesson`.
   - **Example:**  
     Change `http://localhost:8081/explore/6`  
     to `http://localhost:8081/lesson/6`

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
   Contains components and logic required to display and manage the **lesson header** information.
