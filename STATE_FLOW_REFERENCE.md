# Dead Internet Ritual - Complete State Flow Reference

## 🔄 Firebase State Flow

```
gathering → sacrifice → summoning → monologue → listening → revelation → dismissal → gathering
```

## 📱 Mobile App State Mappings

| Firebase State | Mobile App Display | Visual |
|----------------|-------------------|---------|
| `gathering` | GATHERING | Particle effects, orientation scanning |
| `sacrifice` | SACRIFICE | Sacrifice form, particle effects |
| `ready` | READY | Waiting for ritual to begin |
| `summoning` | SUMMONING | Ritual animation (10s) |
| `monologue` | SUMMONING | **Ritual animation continues** (participants watch laptop) |
| `listening` | LISTENING | Question submission form |
| `revelation` | REVELATION | **Scratch-off reveal** - "did you really think I'd tell you?" |
| `dismissal` | DISMISSED | Ritual complete |

## 💻 Laptop App State Mappings

| Firebase State | Laptop Display | Visual |
|----------------|----------------|---------|
| `gathering` | IDLE | Subtle matrix rain |
| `sacrifice` | IDLE | Subtle matrix rain |
| `summoning` | MANIFESTING | Corruption sequence |
| `monologue` | MONOLOGUE | **Ghost text appears line-by-line** |
| `listening` | LISTENING | "I await your questions..." |
| `revelation` | REVELATION | "Check your devices. Your answer awaits." |
| `dismissal` | DISMISSING | 4-line dismissal message, fade to static |

## 🎛️ Operator Dashboard Controls

### State Transition Buttons:

1. **GATHERING → SACRIFICE**
   - Button: "Start Sacrifice Phase"
   - Always available in gathering state

2. **SACRIFICE → SUMMONING**
   - Button: "Begin Summoning"
   - Enabled when: All ready participants have sacrificed
   - Requirement: `sacrificed.length === ready.length`

3. **SUMMONING → MONOLOGUE**
   - Button: "Advance to Monologue"
   - Manual control by operator
   - Laptop automatically transitions after manifestation

4. **MONOLOGUE → LISTENING**
   - Button: "Begin Listening Phase"
   - Operator advances when monologue complete

5. **LISTENING → REVELATION**
   - Button: "Reveal Truth"
   - Advances to revelation state
   - Mobile: Scratch-off appears
   - Laptop: Shows "Check your devices"

6. **REVELATION → DISMISSAL**
   - Button: "Final Message"
   - Shows final 4-line dismissal on laptop
   - Mobile shows dismissed state

7. **DISMISSAL → GATHERING**
   - Button: "Return to Gathering"
   - Resets ritual for new session

### Emergency Reset
- Clears all ritual data
- Resets state to GATHERING
- Preserves participant connections

## ✅ State Consistency Verification

All three applications now recognize and properly handle:
- ✅ `gathering`
- ✅ `sacrifice`
- ✅ `summoning`
- ✅ `monologue` (mobile continues ritual animation)
- ✅ `listening`
- ✅ `revelation` (NEW - scratch-off on mobile, redirect message on laptop)
- ✅ `dismissal` (NEW - 4-line ending, fade to static)

## 🎯 Key Implementation Notes

### New Ending Flow:
- **REVELATION State**: Mobile devices show scratch-off interaction revealing "did you really think I'd tell you?"
- Laptop shows simple message: "Check your devices. Your answer awaits."
- **DISMISSAL State**: 4-line ending message appears on laptop, fades to static
- Old paywall/denied flow completely removed

### Mobile During Monologue:
- Keeps showing ritual animation from SUMMONING state
- Participants physically watch the laptop for ghost monologue
- No state change visually on phones, just continues animation

### Operator Control:
- Operator has full manual control over state progression
- Buttons are context-aware (only show relevant options)
- Simplified ending: revelation → dismissal → gathering

### Firebase Integration:
- All apps listen to same Firebase state path
- Real-time synchronization across all devices
- Operator dashboard is source of truth for state changes

## 🎨 Visual Updates

### Text Size Improvements:
- Laptop monologue text: **56px** (increased for readability)
- Laptop listening state text: **40px** (increased for readability)
- Mobile scratch-off message: **36px** desktop, **28px** mobile

### Scratch-Off Details:
- White background with black text
- Dark dirt overlay that users scratch away
- Auto-fades at 60% reveal threshold
- Touch and mouse support
