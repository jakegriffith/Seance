/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - OPERATOR DASHBOARD
   Central control interface for ritual orchestration
   ═══════════════════════════════════════════════════════════════ */

class OperatorDashboard {
  constructor() {
    this.currentState = 'idle';
    this.participants = {};
    this.questions = {};
    
    // Firebase session
    this.session = null;
    
    this.init();
  }
  
  async init() {
    console.log('🎭 Operator Dashboard Initializing...');
    
    // Initialize Firebase session
    this.session = new RitualSession();
    await this.session.initSession();
    
    this.log('Dashboard connected to Firebase');
    this.log(`Session ID: ${this.session.sessionId}`);
    
    // Setup Firebase listeners
    this.setupFirebaseListeners();
    
    // Setup button event listeners
    this.setupButtonListeners();
    
    this.log('Dashboard ready');
  }
  
  setupFirebaseListeners() {
    // Listen to state changes
    this.session.onStateChange((state) => {
      this.currentState = state;
      this.updateStateDisplay(state);
      this.updateButtonStates(state);
      this.log(`State changed to: ${state.toUpperCase()}`);
    });
    
    // Listen to participant count
    this.session.onParticipantCountChange((count) => {
      document.getElementById('participant-count').textContent = count;
      this.log(`Participant count: ${count}`);
    });
    
    // Listen to all participant data
    this.session.onParticipantsChange((participants) => {
      this.participants = participants;
      this.updateParticipantsTable(participants);
    });
    
    // Listen to questions
    this.session.onQuestionsChange((questions) => {
      this.questions = questions;
      this.updateQuestionsList(questions);
      this.checkQuestionsCompletion(questions);
    });
  }
  
  setupButtonListeners() {
    // All state transition buttons
    const stateButtons = document.querySelectorAll('.state-btn');
    stateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetState = btn.dataset.to;
        this.transitionToState(targetState);
      });
    });
    
    // Emergency reset button
    const resetBtn = document.getElementById('btn-emergency-reset');
    resetBtn.addEventListener('click', () => this.handleEmergencyReset());
  }
  
  async transitionToState(newState) {
    try {
      this.log(`Transitioning to state: ${newState.toUpperCase()}`);
      await this.session.updateState(newState);
    } catch (error) {
      console.error('Failed to transition state:', error);
      this.log(`ERROR: Failed to transition to ${newState}`, 'error');
    }
  }
  
  async handleEmergencyReset() {
    const confirmed = confirm(
      'EMERGENCY RESET\n\n' +
      'This will:\n' +
      '- Delete ALL ritual data\n' +
      '- Remove ALL participants (including disconnected)\n' +
      '- Clear ALL sacrifices and questions\n' +
      '- Completely wipe the Firebase session\n\n' +
      'Are you sure?'
    );
    
    if (!confirmed) return;
    
    try {
      this.log('EMERGENCY RESET initiated - DELETING ALL DATA', 'warning');
      
      // Get all participants from Firebase (including disconnected ones)
      const participantsSnapshot = await this.session.sessionRef.child('participants').once('value');
      const allParticipants = participantsSnapshot.val() || {};
      
      this.log(`Found ${Object.keys(allParticipants).length} participants to delete`, 'warning');
      
      // Delete the entire ritual node
      await this.session.sessionRef.remove();
      
      this.log('All data deleted from Firebase', 'warning');
      
      // Reinitialize the session with clean state
      await this.session.sessionRef.set({
        state: 'idle',
        ritualStarted: false,
        created: firebase.database.ServerValue.TIMESTAMP,
        participantCount: 0
      });
      
      this.log('EMERGENCY RESET complete - Firebase wiped and reinitialized', 'success');
      this.log('Refresh the page to rejoin the clean session', 'info');
    } catch (error) {
      console.error('Emergency reset failed:', error);
      this.log('ERROR: Emergency reset failed', 'error');
    }
  }
  
  updateStateDisplay(state) {
    const stateDisplay = document.getElementById('current-state');
    stateDisplay.textContent = state.toUpperCase();
    stateDisplay.className = `state-value state-${state}`;
  }
  
  updateButtonStates(currentState) {
    // Hide all buttons first
    const allButtons = document.querySelectorAll('.state-btn');
    allButtons.forEach(btn => {
      btn.style.display = 'none';
      btn.disabled = false;
    });
    
    // Show only relevant buttons for current state
    const relevantButtons = document.querySelectorAll(`[data-from="${currentState}"]`);
    relevantButtons.forEach(btn => {
      btn.style.display = 'block';
    });
  }
  
  updateParticipantsTable(participants) {
    const tbody = document.getElementById('participants-tbody');
    
    if (Object.keys(participants).length === 0) {
      tbody.innerHTML = '<tr class="empty-state"><td colspan="4">Waiting for participants...</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    
    for (const [userId, data] of Object.entries(participants)) {
      const row = document.createElement('tr');
      row.className = data.connected ? 'participant-row' : 'participant-row disconnected';
      
      row.innerHTML = `
        <td class="participant-id">${userId}</td>
        <td><span class="status-badge ${data.connected ? 'connected' : 'disconnected'}">${data.connected ? '●' : '○'}</span></td>
        <td><span class="check ${data.isReady ? 'yes' : 'no'}">${data.isReady ? '✓' : '○'}</span></td>
        <td><span class="check ${data.hasSubmittedQuestion ? 'yes' : 'no'}">${data.hasSubmittedQuestion ? '✓' : '○'}</span></td>
      `;
      
      tbody.appendChild(row);
    }
  }
  
  updateQuestionsList(questions) {
    const questionsList = document.getElementById('questions-list');
    const questionsArray = Object.entries(questions);
    
    document.getElementById('question-count').textContent = questionsArray.length;
    
    if (questionsArray.length === 0) {
      questionsList.innerHTML = '<div class="empty-state">No questions submitted yet...</div>';
      return;
    }
    
    questionsList.innerHTML = questionsArray.map(([qId, q]) => `
      <div class="data-item">
        <div class="item-header">
          <span class="item-id">${q.userId || 'unknown'}</span>
          <span class="item-id">${qId}</span>
        </div>
        <div class="item-content">${q.text}</div>
      </div>
    `).join('');
  }
  
  checkQuestionsCompletion(questions) {
    const questionCount = Object.keys(questions).length;
    const btn = document.getElementById('btn-listening-to-revealing');
    
    // Enable revealing button if at least one question has been submitted
    if (questionCount > 0) {
      btn.disabled = false;
      const requirement = btn.querySelector('.btn-requirement');
      if (requirement) {
        requirement.textContent = `(${questionCount} questions ✓)`;
        requirement.style.color = '#00ff88';
      }
    } else {
      btn.disabled = true;
      const requirement = btn.querySelector('.btn-requirement');
      if (requirement) {
        requirement.textContent = '(Waiting for questions)';
        requirement.style.color = '#666';
      }
    }
  }
  
  log(message, type = 'info') {
    const logContainer = document.getElementById('system-log');
    const timestamp = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 50 entries
    while (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.firstChild);
    }
  }
}

// ━━━ INITIALIZE DASHBOARD ━━━
window.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new OperatorDashboard();
});
