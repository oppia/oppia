# Admin Page

The Admin page provides administrative tools for managing Oppia's content and configuration.

## Overview

The Admin page is accessible to users with admin privileges and provides tools for:

- Managing user roles and permissions
- Generating sample data for development
- Configuring platform parameters
- Managing feature flags
- Generating classrooms and content

## Math Classroom Generator

The Admin page includes a **Math Classroom Generator** button that allows curriculum administrators to quickly create a complete mathematics classroom setup for development and testing purposes.

### What It Creates

The generator creates a fully functional math classroom with:

- **3 Skills**: Basic Fractions, Fraction Operations, Advanced Fractions
- **1 Topic**: Fractions with 3 subtopics
- **1 Story**: Fractions Story with 3 interactive chapters
- **3 Explorations**: Chapter 1, 2, 3 as interactive lessons
- **9 Questions**: 3 questions per skill for practice
- **1 Classroom**: Math classroom with proper thumbnails and banners

### Usage

1. Navigate to the Admin page
2. Ensure you have curriculum admin privileges
3. Click the "Generate Math Classroom" button
4. Wait for the generation to complete
5. Verify the classroom appears in the classroom list

### Requirements

- Must be in development mode (`DEV_MODE = True`)
- User must have curriculum admin role
- Server must have write access to create entities

### Generated Content

The generated classroom replicates the structure found on oppiatestserver.org, providing a realistic testing environment for:

- Classroom navigation
- Topic exploration
- Story progression
- Skill practice
- Question answering

## Other Admin Features

### User Role Management

Manage user roles and permissions through the Admin interface.

### Platform Parameters

Configure various platform settings and feature flags.

### Sample Data Generation

Generate sample content for development and testing purposes.

## Access Control

Access to the Admin page is restricted to users with appropriate administrative privileges. Different admin actions may require different levels of access.
