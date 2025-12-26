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
          state: 'gathering',
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
  
  // Reset ritual (clears lock flag)
  async resetRitual() {
    try {
      await this.sessionRef.update({
        state: 'gathering',
        ritualStarted: false
      });
      console.log('🔄 Ritual reset and unlocked');
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
      
      // Start timer if this is the first question
      const snapshot = await this.sessionRef.child('questionTimer').once('value');
      if (!snapshot.exists()) {
        const timerStart = Date.now();
        await this.sessionRef.update({ questionTimer: timerStart });
        console.log('⏱️ Question timer started (30 seconds)');
      }
      
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
  
  // Clean up listeners
  cleanup() {
    this.sessionRef.off();
    this.participantsRef.off();
  }
}

// Export for use
window.RitualSession = RitualSession;
