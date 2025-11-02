# Score Tracker Feature Implementation

## Overview
This implementation adds a real-time score tracker to the Oppia question player that displays the user's current performance as they answer questions. The tracker shows:
- Number of correct answers
- Total number of questions answered
- Visual progress bar with color-coded feedback
- Immediate feedback animations for correct/incorrect answers

## Features Implemented

### 1. Real-Time Score Tracking
- Updates immediately after each answer submission
- Displays "Score: X/Y" format (e.g., "Score: 7/10")
- Shows a visual progress bar that fills based on performance percentage

### 2. Color-Coded Visual Feedback
- **Green (#00965F)**: 70%+ correct (excellent performance)
- **Orange (#F89E1C)**: 50-69% correct (moderate performance)  
- **Red (#D92818)**: Below 50% correct (needs improvement)
- **Gray (#9E9E9E)**: No answers submitted yet

### 3. Interactive Feedback
- Brief animation when answer is submitted
- Green checkmark (✓) for correct answers
- Red X (✗) for incorrect answers
- "Correct!" or "Try again" text feedback
- Animations last 1.5 seconds to not distract from learning

### 4. Responsive Design
- Adapts to different screen sizes
- Optimized layouts for desktop, tablet, and mobile
- Maintains readability across all devices

## Files Created

### 1. `core/templates/components/score-tracker/score-tracker.component.ts`
**Purpose**: Main component logic for the score tracker

**Key Features**:
- Accepts inputs for correctAnswers, totalAnswered, and lastAnswerCorrect
- Calculates score percentage dynamically
- Determines appropriate color based on performance
- Manages feedback animation timing
- Provides accessibility labels for screen readers

### 2. `core/templates/components/score-tracker/score-tracker.component.html`
**Purpose**: Template for the score tracker UI

**Structure**:
- Score label section
- Progress bar with dynamic width and color
- Score text display (X/Y format)
- Feedback indicator (appears temporarily after answers)

### 3. `core/templates/components/score-tracker/score-tracker.component.css`
**Purpose**: Styling for the score tracker

**Highlights**:
- Clean, modern design consistent with Oppia's style
- Smooth animations for visual feedback
- Responsive breakpoints for mobile, tablet, desktop
- Pulse animation for correct answers
- Shake animation for incorrect answers

## Files Modified

### 1. `core/templates/pages/exploration-player-page/services/question-player-engine.service.ts`

**Changes Made**:
- Added score tracking properties: `correctAnswersCount`, `totalAnsweredCount`
- Created `_scoreUpdateEventEmitter` to broadcast score changes
- Added `updateScoreTracking()` method to track correct/incorrect answers
- Added `resetScoreTracking()` method to reset scores for new sessions
- Modified `recordAnswerSubmitted()` to call `updateScoreTracking()`
- Modified `init()` to reset scores when starting new question session
- Added getter `onScoreUpdate` for components to subscribe to score updates

**Why**: The service is the central hub for question state management, making it the ideal place to track answer correctness and emit updates.

### 2. `core/templates/components/question-directives/question-player/question-player.component.ts`

**Changes Made**:
- Added score tracking properties: `correctAnswers`, `totalAnswered`, `lastAnswerCorrect`
- Subscribed to `questionPlayerEngineService.onScoreUpdate` in `ngOnInit()`
- Updates local properties when score changes are emitted

**Why**: The question player component orchestrates the UI and needs to receive score updates to pass them to the score tracker component.

### 3. `core/templates/components/question-directives/question-player/question-player.component.html`

**Changes Made**:
- Added `<oppia-score-tracker>` component below the progress bar in both:
  - New lesson player version (when `isNewLessonPlayerEnabled()` is true)
  - Classic lesson player version (when `isNewLessonPlayerEnabled()` is false)
- Passes correctAnswers, totalAnswered, and lastAnswerCorrect as inputs

**Why**: Places the score tracker in a visible location where users can easily monitor their progress.

### 4. `core/templates/components/shared-component.module.ts`

**Changes Made**:
- Imported `ScoreTrackerComponent`
- Added to `declarations` array
- Added to `exports` array  
- Added to `entryComponents` array

**Why**: Registers the component with Angular so it can be used throughout the application.

## How It Works

### Data Flow

```
1. User submits an answer
   ↓
2. QuestionPlayerEngineService.recordAnswerSubmitted() is called
   ↓
3. Service calls updateScoreTracking(isCorrect)
   ↓
4. Service increments counters and emits score update event
   ↓
5. QuestionPlayerComponent receives the event via subscription
   ↓
6. Component updates its local score properties
   ↓
7. ScoreTrackerComponent receives updated props via @Input
   ↓
8. Component recalculates percentage and colors
   ↓
9. UI updates with new score and feedback animation
```

### Score Calculation

The score percentage is calculated as:
```
scorePercentage = (correctAnswers / totalAnswered) * 100
```

Color coding logic:
```typescript
if (totalAnswered === 0) return Gray
if (percentage >= 70) return Green
if (percentage >= 50) return Orange
return Red
```

## Testing Recommendations

To test this implementation:

1. **Start a practice session** with questions
2. **Answer questions** - both correctly and incorrectly
3. **Verify the score tracker**:
   - Shows "Score: 0/0" initially
   - Updates to "Score: 1/1" after first correct answer
   - Updates to "Score: 1/2" after first incorrect answer
   - Progress bar fills proportionally
   - Colors change at 50% and 70% thresholds
4. **Check animations**:
   - Green checkmark appears for correct answers
   - Red X appears for incorrect answers
   - Feedback disappears after 1.5 seconds
5. **Test responsive design**:
   - Resize browser window
   - Check mobile view (< 480px)
   - Check tablet view (480-768px)
   - Check desktop view (> 768px)

## Benefits

### For Learners
- **Immediate feedback**: Know performance in real-time
- **Motivation**: Visual progress encourages engagement
- **Self-awareness**: Understand when to review material
- **Gamification**: Score element makes practice more engaging

### For Educators
- **Engagement**: Students stay more focused on practice sessions
- **Feedback loop**: Visual cues reinforce learning
- **Progress monitoring**: Clear indicator of comprehension

## Future Enhancements (Optional)

Potential improvements that could be added:
1. Sound effects for correct/incorrect answers (toggle-able)
2. Streak counter for consecutive correct answers
3. Performance badges (e.g., "Perfect Score!", "Improvement!")
4. Historical score comparison (today vs. last session)
5. Export score data for review
6. Customizable color themes

## Accessibility

The implementation includes:
- ARIA labels for screen readers
- Semantic HTML structure
- Sufficient color contrast ratios
- Keyboard navigation support
- Descriptive text alternatives

## Browser Compatibility

The score tracker uses standard CSS and Angular features compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The score tracker only counts the first submission for each question
- Viewing solutions or hints doesn't reset the displayed score
- Score resets when starting a new question session
- The tracker is displayed in both the new and classic lesson player modes
- Score data persists during the session but not across page reloads

## Conclusion

This implementation successfully adds a motivating, real-time score tracking feature to Oppia's question player. It provides immediate visual feedback, uses color cues effectively, and enhances the learning experience without being intrusive or distracting.
