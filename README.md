# DEAD INTERNET RITUAL

An immersive multi-user installation exploring Dead Internet Theory and Dark Forest Theory through ritualistic phone-based interaction.

## Concept

Participants form a physical circle, each using their phone as a divining instrument to summon ghosts from the dead internet. When the ritual is complete, a ghost manifests on a central laptop/display to commune with the seekers. The experience culminates in a darkly comedic paywall twist.

## Firebase Setup

Firebase project created: `dead-internet-ritual`
- Realtime Database configured
- Security rules published
- Full real-time synchronization enabled

## Quick Start

### Local Testing

1. Open in Browser:
   - `index.html` - Mobile interface
   - `laptop.html` - Laptop/display interface

2. All devices automatically join the same ritual
   - No session IDs needed
   - Just open the files

### Testing Multi-Device Locally

Open multiple browser tabs/windows:
- Tab 1: `index.html` (Mobile 1)
- Tab 2: `index.html` (Mobile 2)
- Tab 3: `index.html` (Mobile 3)
- Tab 4: `laptop.html` (Laptop display)

All devices will synchronize in real-time.

## Deployment to Netlify

### Method 1: Drag & Drop

1. Go to https://app.netlify.com/drop
2. Drag your entire project folder
3. You'll get a URL like: `https://your-ritual.netlify.app`

### Method 2: Git Deploy

1. Push your code to GitHub
2. Log in to Netlify
3. Click "New site from Git"
4. Connect your repository
5. Deploy!

### URLs After Deployment

- Mobile: `https://your-ritual.netlify.app/`
- Laptop: `https://your-ritual.netlify.app/laptop.html`
- Operator: `https://your-ritual.netlify.app/operator.html`

No session IDs needed - all devices automatically connect.

### For Installation Use

Generate QR Code:
- Create QR code pointing to: `https://your-ritual.netlify.app/`
- Participants scan to join ritual
- Display laptop at: `https://your-ritual.netlify.app/laptop.html`
- Operator controls ritual from: `https://your-ritual.netlify.app/operator.html`

## How to Use

### Setup

1. Operator Dashboard Setup:
   - Open `https://your-ritual.netlify.app/operator.html` on your control device
   - This is your command center - you control all ritual state transitions
   - View real-time participant data, sacrifices, questions, and votes
   - Keep this open throughout the performance

2. Laptop Setup:
   - Open `https://your-ritual.netlify.app/laptop.html`
   - Press F11 for fullscreen
   - Leave it running - it's the ghost's vessel
   - This display is purely reactive - operator controls it

3. Mobile Setup:
   - Share URL or show QR code: `https://your-ritual.netlify.app/`
   - Participants scan/visit URL
   - Everyone automatically joins same ritual
   - Participants can submit data but cannot advance the ritual

### The Ritual Flow (Operator-Controlled)

All state transitions are controlled by the operator dashboard. Mobile and laptop interfaces are purely reactive.

1. GATHERING to SACRIFICE (Operator clicks)
   - Participants join and their phones detect orientation
   - Operator monitors participant count
   - When ready, operator clicks "Start Sacrifice Phase"

2. SACRIFICE to SUMMONING (Operator clicks when ready)
   - Each participant places physical sacrifice in circle
   - Participants describe sacrifices on phones
   - Operator dashboard shows all sacrifices in real-time
   - Button enables only when all participants have sacrificed
   - Operator clicks "Begin Summoning" when ready

3. SUMMONING to MONOLOGUE (Operator clicks)
   - All devices show summoning animation
   - Laptop begins manifestation sequence
   - Operator advances when animation completes

4. MONOLOGUE to LISTENING (Operator clicks)
   - Ghost speaks on laptop
   - Operator can advance at any point (sync with audio cues)
   - Typical duration: ~45 seconds

5. LISTENING to VOTING (Operator clicks when questions received)
   - Participants submit questions on phones
   - Operator dashboard displays all questions in real-time
   - Button enables when at least one question submitted
   - Operator decides when to advance to voting

6. VOTING to REVEALING (Operator clicks)
   - Participants see submitted questions
   - Vote tallies visible in operator dashboard
   - Operator advances when voting window closes

7. REVEALING to PAYWALL (Operator clicks)
   - Laptop displays winning question dramatically
   - Ghost considers the question
   - Operator advances after dramatic pause

8. PAYWALL to DENIED (Operator clicks)
   - Ghost says: "I have your answer, but first..."
   - "You must provide your credit card..."
   - 45-second countdown timer
   - Operator can skip timer by advancing to denied

9. DENIED to GATHERING (Operator clicks to reset)
   - Ghost: "Your lack of generosity will keep you blind"
   - Screen corrupts
   - Operator returns to gathering to start new cycle

10. EMERGENCY RESET (Operator button)
    - Red emergency button available at all times
    - Resets to GATHERING and clears all participant data
    - Use if ritual breaks or needs restart

## Firebase Database Structure

```
rituals/
  {sessionId}/
    state: "gathering" | "sacrifice" | "ready" | "summoning" | 
           "listening" | "voting" | "waiting" | "denied"
    participantCount: number
    created: timestamp
    
    participants/
      {userId}/
        connected: boolean
        hasSacrificed: boolean
        sacrifice: "text description"
        hasSubmittedQuestion: boolean
        question: "question text"
        hasVoted: boolean
        vote: "questionId"
    
    questions/
      {questionId}/
        userId: string
        text: string
        votes: number
        timestamp: number
```

## Key Features

- Multi-device sync - Up to 10 participants
- Real-time updates - Firebase Realtime Database
- Operator dashboard - Central control interface
- Session-based - Each ritual is isolated
- No authentication - Perfect for installations
- Mobile-first - Optimized for phones
- Laptop as vessel - Passive ghost display
- Physical elements - Real sacrifices in circle
- Dark humor - Paywall twist ending
- Synchronized control - Operator can sync with audio cues
- Live monitoring - View all participant data in real-time
- Emergency reset - Quick recovery from issues

## Technical Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Firebase Realtime Database
- **Effects:** Canvas API, Device Orientation API
- **Hosting:** Netlify (or any static host)
- **No build tools** - Pure web technologies

## Device Requirements

### Mobile
- Modern smartphone (iOS/Android)
- Orientation sensors (gyroscope)
- Modern web browser
- Internet connection

### Laptop
- Large display or projector
- Modern web browser
- Internet connection
- Speakers (optional, for ambiance)

## Customization

### Modify Ghost Dialogue

Edit `js/ghost-content.js`:
- `monologue` - Opening speech
- `dismissal` - Ending speech
- `responses` - Q&A responses (currently unused in paywall version)

### Adjust Timer

Edit `js/laptop-app.js`, line ~340:
```javascript
let timeLeft = 45; // Change duration in seconds
```

### Change Visual Effects

- Colors: Edit `css/shared.css` (CSS variables)
- Animations: Edit `js/visual-effects.js`
- Glitch intensity: Adjust in `laptop-app.js` and `mobile-app.js`

## Troubleshooting

### Devices not syncing?
- Check all use same session ID in URL
- Verify internet connection
- Check browser console for errors

### Laptop not responding?
- Ensure Firebase SDK loaded (check console)
- Verify session ID matches mobile devices
- Refresh the page

### Orientation not working?
- iOS requires permission - tap screen when prompted
- Android should work automatically
- Test device orientation in settings

### Firebase errors?
- Verify database rules are published
- Check Firebase console for activity
- Ensure project is not paused/disabled

## Credits

Themes: Dead Internet Theory, Dark Forest Theory  
Tech: Firebase, HTML5 Canvas, Device Orientation API  
Aesthetic: Retro-computational, glitch art, matrix rain  
Humor: Late capitalism, subscription culture, digital disappointment

## Operator Dashboard Features

The operator dashboard (`operator.html`) provides complete control over the ritual:

### Real-Time Monitoring
- Participant table - Connection status, sacrifice completion, question submission, voting
- Sacrifices panel - View all submitted sacrifices with participant IDs
- Questions panel - See all questions as they're submitted
- Votes panel - Live vote counts for each question
- System log - Real-time event logging

### State Control
- Large, obvious buttons for each state transition
- Conditional enabling (e.g., summoning only enabled when all sacrificed)
- Visual state indicator shows current ritual phase
- Requirements displayed on buttons (e.g., "3/4 sacrifices")

### Safety Features
- Emergency reset button (returns to gathering, clears data)
- All transitions require explicit operator confirmation
- No automatic state advancement

## Future Enhancements

- Audio playback integration with operator dashboard
- Custom timer durations per session
- Analytics (participant count over time)
- Export ritual data (sacrifices, questions)
- Multiple simultaneous sessions
- Operator authentication for public installations

## License

This is an art project - use, modify, and remix as you see fit!

---

The dead internet is not empty. It is full of us.
