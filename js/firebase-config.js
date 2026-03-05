/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - FIREBASE CONFIGURATION
   Real-time database for multi-device synchronization
   ═══════════════════════════════════════════════════════════════ */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmjzDiR2UL0PghtT2LThANh_7saRIv8lk",
  authDomain: "dead-internet-ritual.firebaseapp.com",
  databaseURL: "https://dead-internet-ritual-default-rtdb.firebaseio.com",
  projectId: "dead-internet-ritual",
  storageBucket: "dead-internet-ritual.firebasestorage.app",
  messagingSenderId: "59564648966",
  appId: "1:59564648966:web:a0f0ec3f94e4bac5dc7187"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

// ━━━ AUTO-ADVANCE TIMING CONFIGURATION ━━━
// Adjust these values to tune the experience pacing
const RITUAL_TIMINGS = {
  quiesceMs: 30000,       // Silence window (ms) after last join before advancing from Part 1
  dismissalResetMs: 10000 // Auto-reset delay (ms) after dismissal state
};
window.RITUAL_TIMINGS = RITUAL_TIMINGS;

// ━━━ SESSION MANAGEMENT ━━━
class RitualSession {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getOrCreateUserId();
    this.sessionRef = database.ref(`rituals/${this.sessionId}`);
    this.participantsRef = this.sessionRef.child('participants');
    this.userRef = this.participantsRef.child(this.userId);
    
    console.log('🔥 Firebase connected');
    console.log('Session ID:', this.sessionId);
    console.log('User ID:', this.userId);
  }
  
  // Get or create session ID - using fixed "ritual" session for simplicity
  getOrCreateSessionId() {
    // Always use "ritual" as the session ID
    // This means all devices automatically join the same ritual
    return 'ritual';
  }
  
  // Get or create unique user ID
  getOrCreateUserId() {
    let userId = localStorage.getItem('ritualUserId');
    if (!userId) {
      userId = this.generateId();
      localStorage.setItem('ritualUserId', userId);
    }
    return userId;
  }
  
  // Generate random ID
  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
  
  // Initialize session in database
  async initSession() {
    try {
      const snapshot = await this.sessionRef.once('value');
      
      if (!snapshot.exists()) {
        // New session - initialize
        await this.sessionRef.set({
          state: 'idle',
          ritualStarted: false,
          created: firebase.database.ServerValue.TIMESTAMP,
          participantCount: 0
        });
        console.log('✓ New session initialized');
      } else {
        console.log('✓ Joined existing session');
      }
      
      // Register this participant
      await this.registerParticipant();
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }
  
  // Register participant presence
  async registerParticipant() {
    try {
      await this.userRef.set({
        connected: true,
        isReady: false,
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        hasSubmittedQuestion: false,
        question: null,
        hasVoted: false,
        vote: null
      });

      // Record join time at session level so quiesce window resets on every new arrival
      await this.sessionRef.update({ lastJoinAt: firebase.database.ServerValue.TIMESTAMP });

      // Handle disconnect
      this.userRef.onDisconnect().update({ connected: false });

      // Update participant count
      this.updateParticipantCount();

      console.log('✓ Participant registered');
    } catch (error) {
      console.error('Failed to register participant:', error);
    }
  }
  
  // Update participant count
  async updateParticipantCount() {
    try {
      const snapshot = await this.participantsRef.once('value');
      const participants = snapshot.val() || {};
      
      const connectedCount = Object.values(participants)
        .filter(p => p.connected).length;
      
      await this.sessionRef.update({
        participantCount: connectedCount
      });
    } catch (error) {
      console.error('Failed to update participant count:', error);
    }
  }
  
  // Update ritual state
  async updateState(newState) {
    try {
      const updates = { state: newState };
      
      // Lock ritual forward once summoning begins
      if (newState === 'summoning') {
        updates.ritualStarted = true;
        console.log('🔒 Ritual locked - no backwards transitions allowed');
      }
      
      await this.sessionRef.update(updates);
      console.log('State updated:', newState);
    } catch (error) {
      console.error('Failed to update state:', error);
    }
  }
  
  // Reset ritual — full clean slate for next loop
  async resetRitual() {
    try {
      // Reset session-level fields
      await this.sessionRef.update({
        state: 'idle',
        ritualStarted: false,
        stateChangedAt: null,
        lastJoinAt: null,
        qrVisible: null,
        questionTimer: null,
        selectedQuestion: null,
        questions: null,
        sacrifices: null
      });

      // Reset per-participant flags so Part 1/2/4 conditions work on replay
      const snapshot = await this.participantsRef.once('value');
      const participants = snapshot.val() || {};
      const updates = {};
      for (const userId in participants) {
        if (participants[userId].connected) {
          updates[`${userId}/isReady`] = false;
          updates[`${userId}/hasSubmittedQuestion`] = false;
          updates[`${userId}/question`] = null;
          updates[`${userId}/part1AudioDone`] = null;
          updates[`${userId}/part2AudioDone`] = null;
          updates[`${userId}/part3AudioDone`] = null;
          updates[`${userId}/part4AudioDone`] = null;
          updates[`${userId}/part5AudioDone`] = null;
        }
      }
      if (Object.keys(updates).length > 0) {
        await this.participantsRef.update(updates);
      }

      console.log('🔄 Ritual fully reset');
    } catch (error) {
      console.error('Failed to reset ritual:', error);
    }
  }
  
  // Mark participant as ready
  async setReady() {
    try {
      await this.userRef.update({ isReady: true });
      console.log('✓ User marked as ready');
    } catch (error) {
      console.error('Failed to mark user as ready:', error);
    }
  }
  
  // Submit sacrifice image
  async submitSacrificeImage(imageData) {
    try {
      const sacrificeId = this.generateId();
      
      await this.sessionRef.child('sacrifices').child(sacrificeId).set({
        userId: this.userId,
        imageData: imageData,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      console.log('✓ Sacrifice image submitted');
    } catch (error) {
      console.error('Failed to submit sacrifice image:', error);
    }
  }

  // Submit question
  async submitQuestion(questionText) {
    try {
      const questionId = this.generateId();
      
      await this.sessionRef.child('questions').child(questionId).set({
        userId: this.userId,
        text: questionText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      await this.userRef.update({
        hasSubmittedQuestion: true,
        question: questionText
      });

      console.log('✓ Question submitted');
    } catch (error) {
      console.error('Failed to submit question:', error);
    }
  }
  
  // Pick random question and transition to speaking
  async selectRandomQuestion() {
    try {
      const snapshot = await this.sessionRef.child('questions').once('value');
      const questions = snapshot.val() || {};
      const questionArray = Object.entries(questions);
      
      if (questionArray.length === 0) {
        console.log('⚠️ No questions to select');
        return null;
      }
      
      // Pick random question
      const randomIndex = Math.floor(Math.random() * questionArray.length);
      const [questionId, questionData] = questionArray[randomIndex];
      
      // Store selected question
      await this.sessionRef.update({
        selectedQuestion: {
          id: questionId,
          text: questionData.text,
          userId: questionData.userId
        }
      });
      
      // Transition to speaking state
      await this.updateState('speaking');
      
      console.log('✓ Random question selected:', questionData.text);
      return questionData.text;
    } catch (error) {
      console.error('Failed to select random question:', error);
      return null;
    }
  }
  
  // Submit vote
  async submitVote(questionId) {
    try {
      // Remove previous vote if any
      const snapshot = await this.sessionRef.child('questions').once('value');
      const questions = snapshot.val() || {};
      
      for (const qId in questions) {
        if (questions[qId].votes > 0 && this.userRef.vote === qId) {
          await this.sessionRef.child('questions').child(qId).update({
            votes: questions[qId].votes - 1
          });
        }
      }
      
      // Add new vote
      const questionSnapshot = await this.sessionRef.child('questions').child(questionId).once('value');
      const question = questionSnapshot.val();
      
      await this.sessionRef.child('questions').child(questionId).update({
        votes: (question.votes || 0) + 1
      });
      
      await this.userRef.update({
        hasVoted: true,
        vote: questionId
      });
      
      console.log('✓ Vote submitted');
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  }
  
  // Get winning question
  async getWinningQuestion() {
    try {
      const snapshot = await this.sessionRef.child('questions').once('value');
      const questions = snapshot.val() || {};
      
      let winningQuestion = null;
      let maxVotes = -1;
      
      for (const qId in questions) {
        if (questions[qId].votes > maxVotes) {
          maxVotes = questions[qId].votes;
          winningQuestion = questions[qId];
        }
      }
      
      return winningQuestion;
    } catch (error) {
      console.error('Failed to get winning question:', error);
      return null;
    }
  }
  
  // Listen to state changes
  onStateChange(callback) {
    this.sessionRef.child('state').on('value', (snapshot) => {
      const state = snapshot.val();
      if (state) {
        callback(state);
      }
    });
  }
  
  // Listen to participant count changes
  onParticipantCountChange(callback) {
    this.sessionRef.child('participantCount').on('value', (snapshot) => {
      const count = snapshot.val() || 0;
      callback(count);
    });
  }
  
  // Listen to participant changes
  onParticipantsChange(callback) {
    this.participantsRef.on('value', (snapshot) => {
      const participants = snapshot.val() || {};
      callback(participants);
    });
  }
  
  // Listen to question changes
  onQuestionsChange(callback) {
    this.sessionRef.child('questions').on('value', (snapshot) => {
      const questions = snapshot.val() || {};
      callback(questions);
    });
  }
  
  // Listen for new sacrifice images
  onSacrificeAdded(callback) {
    this.sessionRef.child('sacrifices').on('child_added', (snapshot) => {
      const sacrifice = snapshot.val();
      if (sacrifice) {
        callback(sacrifice);
      }
    });
  }
  
  // Atomically advance state — safe when multiple devices race simultaneously.
  // Only the first device to call this wins; all others see the state already changed.
  async advanceStateWithTransaction(fromState, toState) {
    try {
      const stateRef = this.sessionRef.child('state');
      let didAdvance = false;

      await stateRef.transaction((currentState) => {
        if (currentState === fromState) {
          didAdvance = true;
          return toState;
        }
        return undefined; // Abort — another device already advanced
      });

      if (didAdvance) {
        await this.sessionRef.update({ stateChangedAt: firebase.database.ServerValue.TIMESTAMP });
        console.log(`[AUTO] ${fromState} → ${toState}`);
      }

      return didAdvance;
    } catch (error) {
      console.error('State transaction failed:', error);
      return false;
    }
  }

  // Mark that this participant's audio for a given part has finished
  async markAudioDone(part) {
    try {
      await this.userRef.update({ [`${part}AudioDone`]: true });
    } catch (error) {
      console.error('Failed to mark audio done:', error);
    }
  }

  // Get the timestamp of the last participant join
  async getLastJoinTime() {
    try {
      const snapshot = await this.sessionRef.child('lastJoinAt').once('value');
      return snapshot.val();
    } catch (error) {
      return null;
    }
  }

  // Write the QR code visibility flag (laptop listens to this)
  async setQrVisible(visible) {
    try {
      await this.sessionRef.update({ qrVisible: visible });
    } catch (error) {
      console.error('Failed to set QR visibility:', error);
    }
  }

  // Subscribe to QR visibility changes
  onQrVisibleChange(callback) {
    this.sessionRef.child('qrVisible').on('value', (snapshot) => {
      callback(snapshot.val());
    });
  }

  // Check if all connected participants have finished audio for a given part
  async allParticipantsAudioDone(part) {
    try {
      const snapshot = await this.participantsRef.once('value');
      const participants = snapshot.val() || {};
      const connected = Object.values(participants).filter(p => p.connected);
      if (connected.length === 0) return false;
      return connected.every(p => p[`${part}AudioDone`] === true);
    } catch (error) {
      return false;
    }
  }

  // Check if all connected participants have submitted their drawing
  async allParticipantsSacrificed() {
    try {
      const snapshot = await this.participantsRef.once('value');
      const participants = snapshot.val() || {};
      const connected = Object.values(participants).filter(p => p.connected);
      if (connected.length === 0) return false;
      return connected.every(p => p.isReady === true);
    } catch (error) {
      return false;
    }
  }

  // Check if all connected participants have submitted a question
  async allParticipantsQuestioned() {
    try {
      const snapshot = await this.participantsRef.once('value');
      const participants = snapshot.val() || {};
      const connected = Object.values(participants).filter(p => p.connected);
      if (connected.length === 0) return false;
      return connected.every(p => p.hasSubmittedQuestion === true);
    } catch (error) {
      return false;
    }
  }

  // Clean up listeners
  cleanup() {
    this.sessionRef.off();
    this.participantsRef.off();
  }
}

// Export for use
window.RitualSession = RitualSession;

// ━━━ AUTO-ADVANCE MANAGER ━━━
// Runs on every connected mobile device. Firebase transactions ensure
// only one device actually writes each state transition.
class AutoAdvanceManager {
  constructor(session) {
    this.session = session;
    this.timers = {};
    this.currentState = null;
    this.part1AudioDone = false;
    this.qrFaded = false;
    this.app = null;
    this.active = false; // dormant until user clicks JOIN
  }

  setApp(app) {
    this.app = app;
  }

  activate() {
    this.active = true;
  }

  // Called every time Firebase state changes
  onStateChange(globalState) {
    if (!this.active) return; // don't fire before JOIN click
    this.clearAll();
    this.currentState = globalState;

    if (globalState === 'idle') {
      // First device to join kicks off the ritual after a brief stabilization delay
      this.timers['idle'] = setTimeout(async () => {
        await this.session.advanceStateWithTransaction('idle', 'part1');
      }, 2000);

    } else if (globalState === 'part1') {
      // Start quiesce poller — will advance to part3 when conditions are met
      this.startQuiescePoller();

    } else if (globalState === 'dismissal') {
      this.scheduleDismissalReset();
    }
    // part3, part4, part5 are driven by onAudioEnded()
  }

  // Called by mobile-app when Part 1 audio track finishes on this device
  onPart1AudioEnded() {
    this.part1AudioDone = true;

    // Show drawing canvas locally (no global state change)
    if (this.app) {
      this.app.showDrawingCanvas();
    }

    // Ensure quiesce poller is running
    this.startQuiescePoller();
  }

  // Polls until: quiesce (5s no new joins) AND all drawings submitted → advance to part3
  startQuiescePoller() {
    if (this.timers['quiesce_poll']) return; // Already running

    this.timers['quiesce_poll'] = setInterval(async () => {
      if (this.currentState !== 'part1') {
        clearInterval(this.timers['quiesce_poll']);
        delete this.timers['quiesce_poll'];
        return;
      }

      const lastJoin = await this.session.getLastJoinTime();
      const isQuiesced = lastJoin && (Date.now() - lastJoin) > RITUAL_TIMINGS.quiesceMs;

      // Fade QR on laptop once quiesce hits (one-time)
      if (isQuiesced && !this.qrFaded) {
        this.qrFaded = true;
        this.session.setQrVisible(false);
      }

      // Only advance once THIS device has heard Part 1 audio (ensures drawing canvas showed)
      if (isQuiesced && this.part1AudioDone) {
        const allReady = await this.session.allParticipantsSacrificed();
        if (allReady) {
          this.clearAll();
          await this.session.advanceStateWithTransaction('part1', 'part3');
        }
      }
    }, 2000);
  }

  // Called by mobile-app when any audio track (part2–part5) finishes on this device
  onAudioEnded(part) {
    this.session.markAudioDone(part);
    this.startPartPoller(part);
  }

  // Polls Firebase until all devices have finished the audio (+ questions for part4)
  startPartPoller(part) {
    const pollKey = `${part}_poll`;
    if (this.timers[pollKey]) return;

    const nextPart = { part3: 'part4', part4: 'part5', part5: 'dismissal' };

    this.timers[pollKey] = setInterval(async () => {
      if (this.currentState !== part) {
        clearInterval(this.timers[pollKey]);
        delete this.timers[pollKey];
        return;
      }

      const allAudioDone = await this.session.allParticipantsAudioDone(part);
      if (!allAudioDone) return;

      // Part 4 also requires all questions submitted
      if (part === 'part4') {
        const allQuestioned = await this.session.allParticipantsQuestioned();
        if (!allQuestioned) return;
      }

      this.clearAll();
      const next = nextPart[part];
      if (next) {
        await this.session.advanceStateWithTransaction(part, next);
      }
    }, 2000);
  }

  // Auto-reset the ritual 10 seconds after dismissal
  scheduleDismissalReset() {
    this.timers['dismissal'] = setTimeout(async () => {
      await this.session.resetRitual();
    }, RITUAL_TIMINGS.dismissalResetMs);
  }

  // Cancel all active timers and reset local state
  clearAll() {
    for (const id of Object.values(this.timers)) {
      clearTimeout(id);
      clearInterval(id);
    }
    this.timers = {};
    this.part1AudioDone = false;
    this.qrFaded = false;
  }
}

window.AutoAdvanceManager = AutoAdvanceManager;
