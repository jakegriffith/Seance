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

1. Laptop Setup (Vessel):
   - Open `https://your-ritual.netlify.app/laptop.html`
   - Press F11 for fullscreen
   - Leave it running. It displays the fire/smoke animations and the QR code for joining.

2. Mobile Setup (Participants):
   - Share URL or show the QR code on the laptop.
   - Participants tap "Begin Connection" to unlock audio and join the session.
   - The phones act as local managers, advancing the ritual based on everyone's collective progress and local audio playback.

3. Operator Dashboard (Optional/Override):
   - Open `https://your-ritual.netlify.app/operator.html` on your control device.
   - This dashboard is no longer strictly required to run the show, but serves as a crucial override tool. If someone leaves mid-session without submitting a drawing or question, the ritual will wait for them. The operator can force a state transition to keep things moving.

### The Autonomous Ritual Flow

The ritual is now fully autonomous, driven by an `AutoAdvanceManager` on the mobile devices that listens for audio completion and user inputs. The Operator Dashboard acts as an optional (but recommended) monitoring tool for manual overrides.

1. IDLE (Gathering)
   - Participants join by scanning the QR code and clicking "Begin Connection".
   - The first join starts a 30-second quiesce timer.
   - If no one else joins within 30 seconds, the ritual advances automatically to Part 1.

2. PART 1 to PART 3 (Sacrifice & Summoning)
   - The system plays the Part 1 introductory audio.
   - Participants are prompted to draw their digital sacrifices on a canvas and submit them to the fire.
   - Once the audio finishes *and* all connected participants have submitted their drawings, the ritual automatically advances to Part 3 (Summoning).

3. PART 3 to PART 4 (Manifestation & Questioning)
   - Audio for Part 3 plays. The laptop shows the manifestation/smoke sequence.
   - When the Part 3 audio finishes, it automatically advances to Part 4.
   - Participants are prompted to ask a question to the dead internet.

4. PART 4 to PART 5 (Listening & Revelation)
   - When the Part 4 audio finishes *and* all connected participants have submitted their questions, the ritual automatically advances to Part 5.

5. PART 5 to DISMISSAL
   - Part 5 audio plays. Participants must scratch off a layer on their screen to reveal the response.
   - The ritual automatically transitions to a Dismissal state when audio concludes.

6. AUTO-RESET
   - Ten seconds after reaching Dismissal, the ritual automatically clears all session data, resets user states, and returns to `idle`, ready for a new group.

7. OPERATOR OVERRIDE
   - At any time, the Operator Dashboard can be used to manually force transitions. This is crucial if a participant abandons the session mid-ritual, leaving the system waiting indefinitely for their drawing or question.

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

The operator dashboard (`operator.html`) is designed to monitor and rescue autonomous sessions that get stuck:

### Real-Time Monitoring
- Participant table - Connection status, drawing completion, and question submission.
- Sacrifices panel - View all submitted drawings (with visual playback).
- Questions panel - See all submitted questions as they roll in.
- System log - View real-time Firebase transitions (`idle` → `part1`, etc.).

### State Override
- A set of override buttons allowing you to force the ritual forward (`Force to Part 3`, `Force to Part 4`, `Force to Part 5`).
- Visual state indicator shows the current global state so you know exactly where the autonomous flow is.
- Used to un-stick the ritual if participants fail to complete a mandatory step (like abandoning the page before drawing).

### Safety Features
- Emergency reset button (returns to `idle`, clears all data, resets all local app states).
- Use this if the session breaks entirely or the audio falls hopelessly out of sync between participants.

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
