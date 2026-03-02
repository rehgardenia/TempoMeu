// ===== STATE =====
let state = {
  soundOn: true,
  highContrast: false,
  stars: 3,
  gamesCompleted: 0,
  tasks: [
    { id:1,  name:'Café da manhã',    time:'07:00', image:null, audio:null, color:'#FFEAB5', done:false },
    { id:2,  name:'Escovar os dentes',time:'07:30', image:null, audio:null, color:'#B5E8FF', done:false },
    { id:3,  name:'Tomar remédio',    time:'08:00', image:null, audio:null, color:'#FFB5D6', done:false },
    { id:4,  name:'Estudo',           time:'09:00', image:null, audio:null, color:'#C8B5FF', done:false },
    { id:5,  name:'Almoço',           time:'12:00', image:null, audio:null, color:'#B5FFD3', done:false },
    { id:6,  name:'Descanso',         time:'13:00', image:null, audio:null, color:'#FFE4B5', done:false },
    { id:7,  name:'Atividade física', time:'15:00', image:null, audio:null, color:'#B5F0FF', done:false },
    { id:8,  name:'Jantar',           time:'18:00', image:null, audio:null, color:'#FFB5B5', done:false },
    { id:9,  name:'Banho',            time:'19:00', image:null, audio:null, color:'#B5EEFF', done:false },
    { id:10, name:'Dormir',           time:'21:00', image:null, audio:null, color:'#D0B5FF', done:false },
  ],
  history: [],
  medals: [
    { id:'primeiro', name:'Primeiro Passo', desc:'Complete sua 1ª tarefa', emoji:'🥉', earned:false, req:1 },
    { id:'tres', name:'Trio Incrível', desc:'Complete 3 tarefas', emoji:'🥈', earned:false, req:3 },
    { id:'cinco', name:'Super Estrela', desc:'Complete 5 tarefas', emoji:'🥇', earned:false, req:5 },
    { id:'todas', name:'Campeão do Dia', desc:'Complete todas as tarefas', emoji:'🏆', earned:false, req:null },
    { id:'jogo1', name:'Jogador Iniciante', desc:'Complete 1 jogo', emoji:'🎮', earned:false, reqGames:1 },
    { id:'jogo3', name:'Gênio dos Jogos', desc:'Complete 3 jogos', emoji:'🕹️', earned:false, reqGames:3 },
  ],
  nextTaskId: 11,
};

// ===== AUDIO (Web Audio API) =====
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur=0.3, type='sine', vol=0.3) {
  if (!state.soundOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function playCelebration() {
  if (!state.soundOn) return;
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sine', 0.3), i * 100));
}
function playClick() { playTone(880, 0.1, 'sine', 0.15); }
function playWrong() { playTone(200, 0.4, 'square', 0.15); }
function playCorrect() { [523, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 100)); }

// ===== SOUND & CONTRAST =====
function toggleSound() {
  state.soundOn = !state.soundOn;
  document.getElementById('soundToggleBtn').textContent = state.soundOn ? '🔊' : '🔇';
  const btn = document.getElementById('soundToggleCare');
  const btn2 = document.getElementById('soundToggleCare');
  [document.getElementById('soundToggleCare')].forEach(b => { if(b) b.classList.toggle('on', state.soundOn); });
  playClick();
}
function toggleContrast() {
  state.highContrast = !state.highContrast;
  document.body.classList.toggle('high-contrast', state.highContrast);
  document.getElementById('contrastToggleCare').classList.toggle('on', state.highContrast);
  playClick();
}

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); t.tabIndex = -1; });
  document.getElementById(name + '-section').classList.add('active');
  const tabs = document.querySelectorAll('.nav-tab');
  const names = ['rotina','calendario','jogos','recompensas','humor','cuidador'];
  const idx = names.indexOf(name);
  if (idx >= 0) { tabs[idx].classList.add('active'); tabs[idx].setAttribute('aria-selected','true'); tabs[idx].tabIndex = 0; }
  playClick();
  if(name === 'calendario') renderCalendar();
  if(name === 'recompensas') renderRewards();
  if(name === 'cuidador') updateStats();
  if(name === 'humor') renderMoodSection();
}

// ===== TASKS =====
function taskIconHTML(task) {
  if (task.image) {
    return `<div class="task-icon"><img src="${task.image}" alt="Imagem de ${task.name}" /></div>`;
  }
  // Colored placeholder with first letter
  return `<div class="task-icon no-img" style="background:${task.color};font-size:1.6rem;font-weight:900;color:#555;letter-spacing:0;">${task.name.charAt(0).toUpperCase()}</div>`;
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  state.tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-card' + (task.done ? ' done' : '');
    div.setAttribute('role','listitem');
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', task.name + (task.done ? ', concluída' : ', não concluída'));

    const hasAudio = !!task.audio;
    div.innerHTML = `
      ${taskIconHTML(task)}
      <div class="task-info">
        <div class="task-name">${task.name}</div>
        <div class="task-time">⏰ ${task.time}</div>
      </div>
      <button class="task-audio-btn${hasAudio ? '' : ' no-audio'}" id="audiobtn-${task.id}"
        onclick="event.stopPropagation(); ${hasAudio ? `playTaskAudio(${task.id})` : ''}"
        title="${hasAudio ? 'Ouvir áudio da tarefa' : 'Sem áudio'}"
        aria-label="${hasAudio ? 'Ouvir ' + task.name : 'Sem áudio para ' + task.name}">
        🔊
      </button>
      <div class="task-check">${task.done ? '✓' : ''}</div>
    `;
    div.onclick = () => toggleTask(task.id);
    div.onkeydown = (e) => { if(e.key === 'Enter' || e.key === ' ') toggleTask(task.id); };
    list.appendChild(div);
  });
  updateProgress();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  if (!task.done) {
    task.done = true;
    state.stars += 1;
    state.history.unshift({ name: task.name, image: task.image, time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) });
    updateStars();
    showCelebration();
    playCelebration();
    checkMedals();
  } else {
    task.done = false;
    if (state.stars > 0) state.stars -= 1;
    updateStars();
  }
  renderTasks();
}

function updateProgress() {
  const done = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct = Math.round((done / total) * 100);
  const fill = document.getElementById('progressFill');
  const bar = document.getElementById('progressBar');
  fill.style.width = pct + '%';
  fill.textContent = pct + '%';
  bar.setAttribute('aria-valuenow', pct);
}

function updateStars() {
  document.getElementById('starsCount').textContent = state.stars;
  const stars = '⭐'.repeat(Math.min(state.stars, 10));
  document.getElementById('starsDisplay').textContent = stars || '';
  document.getElementById('statStars').textContent = state.stars;
}

function addTask() {
  const name = document.getElementById('newTaskName').value.trim();
  const time = document.getElementById('newTaskTime').value || '12:00';
  const imageDataUrl = document.getElementById('newTaskImageData').value || null;
  const audioDataUrl = document.getElementById('newTaskAudioData').value || null;
  if (!name) { alert('Por favor, escreva o nome da tarefa!'); return; }
  const colors = ['#FFEAB5','#B5E8FF','#FFB5D6','#C8B5FF','#B5FFD3','#FFE4B5','#B5F0FF'];
  state.tasks.push({
    id: state.nextTaskId++,
    name, time,
    image: imageDataUrl,
    audio: audioDataUrl,
    color: colors[Math.floor(Math.random() * colors.length)],
    done: false
  });
  // Reset all form fields
  document.getElementById('newTaskName').value = '';
  document.getElementById('newTaskTime').value = '';
  document.getElementById('newTaskImageData').value = '';
  document.getElementById('newTaskAudioData').value = '';
  const prev = document.getElementById('addImgPreview');
  prev.classList.remove('filled');
  prev.innerHTML = `<span class="add-img-placeholder-icon">📷</span><span class="add-img-placeholder-text">Toque para<br>adicionar foto</span><input type="file" accept="image/*" onchange="previewNewTaskImage(this)" aria-label="Foto da tarefa" />`;
  document.getElementById('newAudioPreview').style.display = 'none';
  document.getElementById('newAudioUploadBtn').classList.remove('has-audio');
  stopNewTaskRecording();
  renderTasks();
  renderCareTaskList();
  updateStats();
  playClick();
}

function previewNewTaskImage(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('newTaskImageData').value = e.target.result;
    const prev = document.getElementById('addImgPreview');
    prev.classList.add('filled');
    prev.innerHTML = `<img src="${e.target.result}" alt="Prévia" /><input type="file" accept="image/*" onchange="previewNewTaskImage(this)" aria-label="Foto da tarefa" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

function setTaskImage(taskId, input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.image = e.target.result;
      renderTasks();
      renderCareTaskList();
    }
  };
  reader.readAsDataURL(input.files[0]);
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  renderTasks();
  renderCareTaskList();
  updateStats();
}

function startEditTime(taskId) {
  const row = document.getElementById('care-row-' + taskId);
  if (!row) return;
  const task = state.tasks.find(t => t.id === taskId);
  const timeEl = row.querySelector('.care-task-time');
  timeEl.innerHTML = `<input class="inline-time-edit" type="time" value="${task.time}" onchange="saveTaskTime(${taskId}, this.value)" onblur="renderCareTaskList()" aria-label="Novo horário" />`;
  timeEl.querySelector('input').focus();
}

function saveTaskTime(taskId, newTime) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) { task.time = newTime; renderTasks(); }
}

function renderCareTaskList() {
  const container = document.getElementById('careTaskList');
  if (!container) return;
  if (state.tasks.length === 0) {
    container.innerHTML = '<p style="color:var(--text-soft);font-weight:700;padding:12px 0">Nenhuma tarefa ainda.</p>';
    return;
  }
  container.innerHTML = state.tasks.map(task => `
    <div class="care-task-item" id="care-row-${task.id}">
      <div class="care-task-thumb" title="Clique para trocar a foto">
        ${task.image
          ? `<img src="${task.image}" alt="Foto de ${task.name}" />`
          : `<span style="font-size:1.6rem;font-weight:900;color:#888">${task.name.charAt(0).toUpperCase()}</span>`
        }
        <input type="file" accept="image/*" onchange="setTaskImage(${task.id}, this)" aria-label="Trocar foto de ${task.name}" />
      </div>
      <div class="care-task-info" style="flex:1;min-width:0;">
        <div class="care-task-name">${task.name}</div>
        <div class="care-task-time" id="time-display-${task.id}">⏰ ${task.time}</div>
        <div class="audio-upload-row" style="margin-top:6px;">
          ${task.audio ? `
            <div class="audio-preview-row" style="flex:1;">
              <button class="audio-play-mini" onclick="playTaskAudio(${task.id})" aria-label="Ouvir áudio de ${task.name}">▶</button>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🔊 Áudio salvo</span>
              <button class="audio-remove-btn" onclick="removeTaskAudio(${task.id})" aria-label="Remover áudio de ${task.name}">✕</button>
            </div>
          ` : `
            <label class="audio-upload-btn" title="Enviar arquivo de áudio para ${task.name}">
              📁 Enviar áudio
              <input type="file" accept="audio/*" onchange="setTaskAudioFile(${task.id}, this)" aria-label="Enviar áudio para ${task.name}" />
            </label>
            <button class="record-btn" id="rec-btn-${task.id}" onclick="toggleTaskRecording(${task.id})" type="button" aria-label="Gravar voz para ${task.name}">
              <span class="rec-dot"></span> Gravar
            </button>
          `}
        </div>
      </div>
      <div class="care-task-actions">
        <button class="care-small-btn edit-time" onclick="startEditTime(${task.id})" title="Editar horário" aria-label="Editar horário de ${task.name}">🕐</button>
        <button class="care-small-btn del" onclick="deleteTask(${task.id})" title="Remover tarefa" aria-label="Remover ${task.name}">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ===== CELEBRATION =====
function showCelebration() {
  const cel = document.getElementById('celebration');
  const emojis = ['🌟','⭐','🎉','🎊','🥳','💫','✨'];
  const e = document.createElement('div');
  e.className = 'celebration-emoji';
  e.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  cel.appendChild(e);
  const colors = ['#FFD166','#06D6A0','#118AB2','#EF476F','#C9B1FF','#FF6B6B'];
  for (let i = 0; i < 18; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}vw;
      top:${Math.random()*30}vh;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*0.4}s;
      animation-duration:${0.8 + Math.random()*0.6}s;
      transform: rotate(${Math.random()*360}deg);
      border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1500);
  }
  setTimeout(() => { e.remove(); }, 1000);
}

// ===== MEDALS =====
function checkMedals() {
  const done = state.tasks.filter(t => t.done).length;
  state.medals.forEach(m => {
    if (m.earned) return;
    if (m.req !== undefined && m.req !== null && done >= m.req) { m.earned = true; playCelebration(); }
    if (m.req === null && done === state.tasks.length) { m.earned = true; playCelebration(); }
    if (m.reqGames && state.gamesCompleted >= m.reqGames) { m.earned = true; playCelebration(); }
  });
}

function renderRewards() {
  const grid = document.getElementById('rewardsGrid');
  grid.innerHTML = '';
  state.medals.forEach(m => {
    const div = document.createElement('div');
    div.className = 'medal-card' + (m.earned ? ' earned' : '');
    div.setAttribute('aria-label', m.name + (m.earned ? ', conquistada' : ', ainda não conquistada'));
    div.innerHTML = `<span class="medal-emoji">${m.emoji}</span><div class="medal-name">${m.name}</div><div class="medal-desc">${m.desc}</div>`;
    grid.appendChild(div);
  });
}

// ===== CALENDAR =====
const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const SEASONS = [
  { name:'Verão', emoji:'☀️', class:'season-verao', months:[11,0,1] },
  { name:'Outono', emoji:'🍂', class:'season-outono', months:[2,3,4] },
  { name:'Inverno', emoji:'❄️', class:'season-inverno', months:[5,6,7] },
  { name:'Primavera', emoji:'🌸', class:'season-primavera', months:[8,9,10] },
];

function renderCalendar() {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

  // Date cards
  const dateDisplay = document.getElementById('dateDisplay');
  dateDisplay.innerHTML = `
    <div class="date-card">
      <div class="date-card-emoji">⬅️</div>
      <div class="date-card-label">Ontem</div>
      <div class="date-card-value">${DIAS[yesterday.getDay()]}, ${yesterday.getDate()}</div>
    </div>
    <div class="date-card today-card">
      <div class="today-badge">HOJE</div>
      <div class="date-card-emoji">📅</div>
      <div class="date-card-label">${MESES[today.getMonth()]} ${today.getFullYear()}</div>
      <div class="date-card-value">${DIAS[today.getDay()]}, ${today.getDate()}</div>
    </div>
    <div class="date-card">
      <div class="date-card-emoji">➡️</div>
      <div class="date-card-label">Amanhã</div>
      <div class="date-card-value">${DIAS[tomorrow.getDay()]}, ${tomorrow.getDate()}</div>
    </div>
  `;

  // Month grid
  const grid = document.getElementById('monthGrid');
  grid.innerHTML = DIAS_SHORT.map(d => `<div class="month-day-header">${d}</div>`).join('');
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const prevDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.innerHTML += `<div class="month-day other-month">${prevDays - i}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate();
    grid.innerHTML += `<div class="month-day${isToday ? ' today-day' : ''}">${d}</div>`;
  }
  let remaining = 42 - firstDay - daysInMonth;
  if (remaining > 7) remaining -= 7;
  for (let d = 1; d <= remaining; d++) {
    grid.innerHTML += `<div class="month-day other-month">${d}</div>`;
  }

  // Seasons
  const seasonGrid = document.getElementById('seasonGrid');
  seasonGrid.innerHTML = '';
  const curMonth = today.getMonth();
  const SEASON_PHOTOS = {
    'Verão':     'https://unsplash.com/pt-br/fotografias/seashore-during-golden-hour-KMn4VEeEPR8',
    'Outono':    'https://unsplash.com/pt-br/fotografias/um-banco-sentado-no-meio-de-uma-floresta-ao-lado-de-um-lago-4PWEXNlnhbo',
    'Inverno':   'https://unsplash.com/pt-br/fotografias/fotografia-de-foco-raso-de-arvores-cheias-de-neve-UdgvzNom0Xs',
    'Primavera': 'https://unsplash.com/pt-br/fotografias/fotografia-aerea-de-flores-durante-o-dia-TRhGEGdw-YY',
  };
  SEASONS.forEach(s => {
    const isCurrent = s.months.includes(curMonth);
    const div = document.createElement('div');
    div.className = `season-card${isCurrent ? ' current' : ''}`;
    div.setAttribute('aria-label', s.name + (isCurrent ? ', estação atual' : ''));
    div.innerHTML = `
      <img src="${SEASON_PHOTOS[s.name]}" alt="Foto da estação ${s.name}" loading="lazy" />
      <div class="season-card-overlay">
        <span class="season-emoji">${s.emoji}</span>
        <span>${s.name}</span>
        ${isCurrent ? '<span class="season-now-badge">Agora!</span>' : ''}
      </div>
    `;
    seasonGrid.appendChild(div);
  });

  // Quiz
  renderCalendarQuiz();
}

let quizAnswered = false;
function renderCalendarQuiz() {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const tomorrowName = DIAS[tomorrow.getDay()];
  const options = [...DIAS].sort(() => Math.random() - 0.5).slice(0, 4);
  if (!options.includes(tomorrowName)) { options[0] = tomorrowName; }
  const shuffled = options.sort(() => Math.random() - 0.5);

  const area = document.getElementById('quizArea');
  quizAnswered = false;
  area.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-question">Se hoje é <strong>${DIAS[today.getDay()]}</strong>, qual é o dia de <strong>amanhã</strong>? 🤔</div>
      <div class="quiz-options">
        ${shuffled.map(d => `
          <button class="quiz-option" onclick="answerQuiz(this,'${d}','${tomorrowName}')" aria-label="${d}">
            <span class="opt-emoji">${d === 'Sábado' || d === 'Domingo' ? '🌈' : '📅'}</span>
            ${d}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function answerQuiz(btn, chosen, correct) {
  if (quizAnswered) return;
  quizAnswered = true;
  if (chosen === correct) {
    btn.classList.add('correct');
    playCorrect();
    state.stars += 1;
    updateStars();
    showCelebration();
  } else {
    btn.classList.add('wrong');
    playWrong();
    document.querySelectorAll('.quiz-option').forEach(b => {
      if (b.textContent.trim().includes(correct)) b.classList.add('correct');
    });
  }
  setTimeout(renderCalendarQuiz, 2500);
}

// ===== GAMES =====
function startGame(type) {
  document.getElementById('gameGrid').style.display = 'none';
  const area = document.getElementById('gameArea');
  area.classList.add('visible');
  if (type === 'match') renderMatchGame(area);
  else if (type === 'syllable') renderSyllableGame(area);
  else if (type === 'sequence') renderSequenceGame(area);
}

function backToGames() {
  document.getElementById('gameGrid').style.display = '';
  const area = document.getElementById('gameArea');
  area.classList.remove('visible');
  area.innerHTML = '';
  playClick();
}

// MATCH GAME WITH REAL PHOTOS
const matchItems = [
  { word:'Cachorro', key:'cachorro', photo:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80', alt:'Foto de um cachorro' },
  { word:'Maçã',    key:'maca',     photo:'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80', alt:'Foto de uma maçã' },
  { word:'Gato',    key:'gato',     photo:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80', alt:'Foto de um gato' },
  { word:'Banana',  key:'banana',   photo:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80', alt:'Foto de uma banana' },
  { word:'Peixe',   key:'peixe',    photo:'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=300&q=80', alt:'Foto de um peixe' },
  { word:'Laranja', key:'laranja',  photo:'https://images.unsplash.com/photo-1547514701-42782101795e?w=300&q=80', alt:'Foto de uma laranja' },
];

let matchCurrentSet = [];
let matchPhotoSel = null;
let matchWordSel = null;
let matchPhotoMatched = 0;

function renderMatchGame(area) {
  // pick 4 random items
  matchCurrentSet = [...matchItems].sort(() => Math.random()-0.5).slice(0,4);
  matchPhotoSel = null;
  matchWordSel = null;
  matchPhotoMatched = 0;

  const shuffledPhotos = [...matchCurrentSet].sort(() => Math.random()-0.5);

  area.innerHTML = `
    <div class="game-header">
      <button class="back-btn" onclick="backToGames()">← Voltar</button>
      <h2 style="font-size:1.4rem;font-weight:900">🔗 Palavra e Imagem</h2>
    </div>
    <p style="font-weight:700;color:var(--text-soft);margin-bottom:20px">Toque na palavra e depois na foto que combina! 👆</p>
    <div class="match-photo-game">
      <div>
        <p style="font-weight:800;margin-bottom:10px;font-size:1rem;">📝 Palavras:</p>
        <div class="match-words-row" id="matchWordsRow">
          ${matchCurrentSet.map((item,i) => `
            <button class="match-word-btn" id="mw${i}" onclick="selectMatchWord(${i})" aria-label="${item.word}">
              ${item.word}
            </button>
          `).join('')}
        </div>
      </div>
      <div>
        <p style="font-weight:800;margin-bottom:10px;font-size:1rem;">📸 Fotos:</p>
        <div class="match-photos-row" id="matchPhotosRow">
          ${shuffledPhotos.map((item,i) => `
            <button class="match-photo-btn" id="mp${i}" onclick="selectMatchPhoto(${i},'${item.key}')" aria-label="Foto de ${item.word}">
              <img class="match-photo-img" src="${item.photo}" alt="${item.alt}" loading="lazy" />
              <div class="match-photo-label">✓ ${item.word}</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="result-msg" id="matchResult"></div>
  `;
  area._shuffledPhotos = shuffledPhotos;
}

function selectMatchWord(idx) {
  if (document.getElementById('mw'+idx).classList.contains('matched')) return;
  document.querySelectorAll('.match-word-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('mw'+idx).classList.add('selected');
  matchWordSel = idx;
  playClick();
  tryMatchPair(area);
}

function selectMatchPhoto(idx, key) {
  if (document.getElementById('mp'+idx).classList.contains('matched')) return;
  const area = document.getElementById('gameArea');
  // deselect other photos
  document.querySelectorAll('.match-photo-btn').forEach(b => { if(!b.classList.contains('matched')) b.style.borderColor = ''; });
  document.getElementById('mp'+idx).style.borderColor = 'var(--sun)';
  matchPhotoSel = { idx, key };
  playClick();
  if (matchWordSel !== null) {
    const wordKey = matchCurrentSet[matchWordSel].key;
    if (wordKey === key) {
      // Correct!
      document.getElementById('mw'+matchWordSel).classList.replace('selected','matched');
      document.getElementById('mp'+idx).classList.add('matched');
      document.getElementById('mp'+idx).style.borderColor = '';
      matchPhotoMatched++;
      playCorrect();
      matchWordSel = null;
      matchPhotoSel = null;
      if (matchPhotoMatched === matchCurrentSet.length) {
        state.gamesCompleted++;
        state.stars += 3;
        updateStars();
        checkMedals();
        playCelebration();
        showCelebration();
        const r = document.getElementById('matchResult');
        r.className = 'result-msg correct-msg show';
        r.textContent = '🎉 Parabéns! Você acertou tudo! +3 estrelas!';
      }
    } else {
      // Wrong
      playWrong();
      const btn = document.getElementById('mp'+idx);
      btn.classList.add('wrong-flash');
      document.getElementById('mw'+matchWordSel).classList.remove('selected');
      setTimeout(() => { btn.classList.remove('wrong-flash'); btn.style.borderColor = ''; }, 400);
      matchWordSel = null;
      matchPhotoSel = null;
    }
  }
}

let matchSel = null;

// SYLLABLE GAME with photos
const syllableWords = [
  { word: 'BO-LA', display: 'BOLA', syllables: ['BO','LA'], wrong: ['CA','MA','LE'],
    photo: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=300&q=80', alt:'Foto de uma bola' },
  { word: 'CA-SA', display: 'CASA', syllables: ['CA','SA'], wrong: ['BO','NA','TE'],
    photo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300&q=80', alt:'Foto de uma casa' },
  { word: 'PA-TO', display: 'PATO', syllables: ['PA','TO'], wrong: ['CA','ME','BO'],
    photo: 'https://images.unsplash.com/photo-1551189014-fe516b7e8821?w=300&q=80', alt:'Foto de um pato' },
  { word: 'GA-TO', display: 'GATO', syllables: ['GA','TO'], wrong: ['CA','ME','BO'],
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80', alt:'Foto de um gato' },
];
let sylIdx = 0;

function renderSyllableGame(area) {
  sylIdx = 0;
  renderSylRound(area);
}

function renderSylRound(area) {
  if (sylIdx >= syllableWords.length) {
    state.gamesCompleted++;
    state.stars += 2;
    updateStars();
    checkMedals();
    playCelebration();
    showCelebration();
    area.innerHTML = `
      <div class="game-header">
        <button class="back-btn" onclick="backToGames()">← Voltar</button>
      </div>
      <div style="text-align:center;padding:40px">
        <div style="font-size:5rem">🎉</div>
        <h2 style="font-size:2rem;font-weight:900;margin:16px 0">Muito bem! +2 estrelas!</h2>
        <button class="btn btn-success" onclick="renderSyllableGame(document.getElementById('gameArea'));sylIdx=0;" style="margin:auto">Jogar de novo 🔄</button>
      </div>
    `;
    return;
  }
  const w = syllableWords[sylIdx];
  const all = [...w.syllables, ...w.wrong].sort(() => Math.random()-0.5).slice(0,6);
  area.innerHTML = `
    <div class="game-header">
      <button class="back-btn" onclick="backToGames()">← Voltar</button>
      <h2 style="font-size:1.4rem;font-weight:900">🔤 Sílabas (${sylIdx+1}/${syllableWords.length})</h2>
    </div>
    <p style="font-weight:700;color:var(--text-soft);margin-bottom:12px">Qual sílaba completa a palavra? Toque nela!</p>
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px;flex-wrap:wrap;">
      <img src="${w.photo}" alt="${w.alt}" style="width:130px;height:100px;object-fit:cover;border-radius:18px;border:4px solid var(--border);flex-shrink:0;" loading="lazy"/>
      <div class="syllable-word" id="sylWord" style="font-size:3rem;margin:0;">${w.syllables[0]}-<span style="color:var(--border)">?</span></div>
    </div>
    <div class="syllable-options">
      ${all.map(s => `<button class="syllable-btn" onclick="checkSyllable(this,'${s}','${w.syllables[1]}')">${s}</button>`).join('')}
    </div>
    <div class="result-msg" id="sylResult"></div>
  `;
}

function checkSyllable(btn, chosen, correct) {
  const r = document.getElementById('sylResult');
  if (chosen === correct) {
    document.getElementById('sylWord').innerHTML = syllableWords[sylIdx].syllables[0] + '-' + correct;
    document.getElementById('sylWord').style.color = '#76C442';
    r.className = 'result-msg correct-msg show';
    r.textContent = '✅ Correto! Muito bem!';
    playCorrect();
    state.stars += 1;
    updateStars();
    sylIdx++;
    setTimeout(() => renderSylRound(document.getElementById('gameArea')), 1200);
  } else {
    r.className = 'result-msg wrong-msg show';
    r.textContent = '❌ Tente de novo!';
    btn.style.background = '#ffd5d5';
    btn.style.borderColor = 'var(--coral)';
    playWrong();
    setTimeout(() => { r.className = 'result-msg'; btn.style.background = ''; btn.style.borderColor = ''; }, 800);
  }
}

// SEQUENCE GAME
const sequences = [
  [
    { emoji:'🌅', label:'Acordar' },
    { emoji:'🍳', label:'Café' },
    { emoji:'🪥', label:'Dentes' },
    { emoji:'👕', label:'Vestir' },
  ],
  [
    { emoji:'📚', label:'Estudar' },
    { emoji:'🍽️', label:'Almoço' },
    { emoji:'😴', label:'Descanso' },
    { emoji:'🏃', label:'Atividade' },
  ],
];
let seqCurrent = [];
let seqCorrect = [];
let seqPlaced = [];

function renderSequenceGame(area) {
  const seq = sequences[Math.floor(Math.random() * sequences.length)];
  seqCorrect = seq;
  seqCurrent = [...seq].sort(() => Math.random() - 0.5);
  seqPlaced = new Array(seq.length).fill(null);

  area.innerHTML = `
    <div class="game-header">
      <button class="back-btn" onclick="backToGames()">← Voltar</button>
      <h2 style="font-size:1.4rem;font-weight:900">📋 Sequência do Dia</h2>
    </div>
    <p style="font-weight:700;color:var(--text-soft);margin-bottom:16px">Coloque as atividades na ordem certa do dia! Clique para selecionar e depois clique onde quer colocar.</p>
    <h3 style="font-weight:800;margin-bottom:10px">Escolha aqui:</h3>
    <div class="sequence-items" id="seqSource">
      ${seqCurrent.map((item,i) => `
        <div class="seq-item" id="seqSrc${i}" onclick="selectSeqItem(${i})" tabindex="0">
          <span class="seq-emoji">${item.emoji}</span>${item.label}
        </div>
      `).join('')}
    </div>
    <h3 style="font-weight:800;margin:16px 0 10px">Coloque aqui na ordem:</h3>
    <div class="sequence-items" id="seqDest">
      ${seq.map((_,i) => `
        <div class="seq-dropzone" id="seqDst${i}" onclick="placeSeqItem(${i})">${i+1}</div>
      `).join('')}
    </div>
    <button class="check-btn" onclick="checkSequence()">✅ Verificar</button>
    <div class="result-msg" id="seqResult"></div>
  `;
}

let selectedSeqItem = null;
function selectSeqItem(idx) {
  document.querySelectorAll('.seq-item').forEach(el => el.style.borderColor = '');
  const el = document.getElementById('seqSrc' + idx);
  if (el.style.opacity === '0.3') return;
  selectedSeqItem = idx;
  el.style.borderColor = 'var(--sun)';
  el.style.background = '#FFF8E1';
  playClick();
}

function placeSeqItem(dstIdx) {
  if (selectedSeqItem === null) return;
  const item = seqCurrent[selectedSeqItem];
  const dst = document.getElementById('seqDst' + dstIdx);

  // Clear previous item in this spot
  const prevItem = seqPlaced[dstIdx];
  if (prevItem !== null) {
    document.getElementById('seqSrc' + prevItem).style.opacity = '1';
    document.getElementById('seqSrc' + prevItem).style.pointerEvents = 'auto';
  }

  seqPlaced[dstIdx] = selectedSeqItem;
  dst.innerHTML = `<span style="font-size:2rem">${item.emoji}</span><br><span style="font-size:0.9rem;font-weight:800">${item.label}</span>`;
  dst.style.background = '#f0f8f0';
  dst.style.borderStyle = 'solid';

  document.getElementById('seqSrc' + selectedSeqItem).style.opacity = '0.3';
  document.getElementById('seqSrc' + selectedSeqItem).style.pointerEvents = 'none';
  selectedSeqItem = null;
  playClick();
}

function checkSequence() {
  const r = document.getElementById('seqResult');
  const correct = seqPlaced.every((srcIdx, dstIdx) => {
    if (srcIdx === null) return false;
    return seqCurrent[srcIdx].label === seqCorrect[dstIdx].label;
  });
  if (correct) {
    r.className = 'result-msg correct-msg show';
    r.textContent = '🎉 Sequência correta! Parabéns! +3 estrelas!';
    state.stars += 3;
    state.gamesCompleted++;
    updateStars();
    checkMedals();
    playCelebration();
    showCelebration();
  } else {
    r.className = 'result-msg wrong-msg show';
    r.textContent = '❌ Não está certo! Tente de novo!';
    playWrong();
    setTimeout(() => { r.className = 'result-msg'; }, 1500);
  }
}

// ===== STATS =====
function updateStats() {
  const done = state.tasks.filter(t => t.done).length;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statStars').textContent = state.stars;
  document.getElementById('statGames').textContent = state.gamesCompleted;
  document.getElementById('statTotal').textContent = state.tasks.length;
  renderCareTaskList();

  // History
  const histEl = document.getElementById('historyList');
  if (state.history.length === 0) {
    histEl.innerHTML = '<p style="color:var(--text-soft);font-weight:700">Nenhuma tarefa concluída ainda.</p>';
  } else {
    histEl.innerHTML = state.history.map(h => `
      <div class="history-item">
        <div class="history-dot"></div>
        ${h.image
          ? `<img src="${h.image}" alt="${h.name}" style="width:32px;height:32px;object-fit:cover;border-radius:8px;flex-shrink:0;" />`
          : `<span style="font-size:1.4rem;font-weight:900;color:#888">${h.name.charAt(0)}</span>`
        }
        <span style="flex:1">${h.name}</span>
        <span style="color:var(--text-soft);font-size:0.9rem">${h.time}</span>
      </div>
    `).join('');
  }
}

// ===== MOOD MONITOR =====
const MOODS = [
  {
    id: 'feliz', label: '😄 Feliz', color: '#FFD166', borderColor: '#E6B800',
    photo: 'humor-feliz.jpg',
    alt: 'Criança feliz sorrindo',
    message: 'Que ótimo! Hoje está sendo um dia incrível! Continue assim! 🌟'
  },
  {
    id: 'triste', label: '😢 Triste', color: '#C9B1FF', borderColor: '#9B86E8',
    photo: 'humor-triste.jpg',
    alt: 'Criança triste com expressão cabisbaixa',
    message: 'Tudo bem ficar triste às vezes. Converse com alguém que você ama! 🤗'
  },
  {
    id: 'tranquilo', label: '🙂 Tranquilo', color: '#A8E6CF', borderColor: '#76C4A8',
    photo: 'humor-tranquilo.jpg',
    alt: 'Criança tranquila',
    message: 'Você está indo muito bem. Eu tenho orgulho de você.💗'
  },
  {
    id: 'bravo', label: '😠 Bravo', color: '#FFCBA4', borderColor: '#E8A87C',
    photo: 'humor-bravo.jpg', 
    alt: 'Adulto com expressão de brava',
    message: 'Respira fundo! Você pode conversar com alguém sobre o que te incomoda. 💨'
  },
];

let selectedMoodId = null;
let moodHistory = [];

function renderMoodSection() {
  const grid = document.getElementById('moodGrid');
  grid.innerHTML = '';
  MOODS.forEach(mood => {
    const card = document.createElement('div');
    card.className = 'mood-card' + (selectedMoodId === mood.id ? ' selected' : '');
    card.style.borderColor = selectedMoodId === mood.id ? mood.borderColor : '';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Estou ' + mood.label.replace(/[^\w\s]/gi,'').trim());
    card.innerHTML = `
      <div class="mood-selected-badge">✓</div>
      <img class="mood-photo" src="${mood.photo}" alt="${mood.alt}" loading="lazy"/>
      <div class="mood-label" style="background:${mood.color}22">${mood.label}</div>
    `;
    card.onclick = () => selectMood(mood.id, mood.color, mood.borderColor);
    card.onkeydown = e => { if(e.key==='Enter'||e.key===' ') selectMood(mood.id, mood.color, mood.borderColor); };
    grid.appendChild(card);
  });
  renderMoodHistory();
}

function selectMood(id, color, borderColor) {
  selectedMoodId = id;
  document.querySelectorAll('.mood-card').forEach((card, i) => {
    const mood = MOODS[i];
    card.classList.toggle('selected', mood.id === id);
    card.style.borderColor = mood.id === id ? mood.borderColor : '';
  });
  document.getElementById('moodConfirmBtn').disabled = false;
  document.getElementById('moodResult').classList.remove('show');
  playClick();
}

function confirmMood() {
  if (!selectedMoodId) return;
  const mood = MOODS.find(m => m.id === selectedMoodId);
  const now = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  moodHistory.unshift({ mood, time: now });

  const resultEl = document.getElementById('moodResult');
  document.getElementById('moodResultEmoji').textContent = mood.label.split(' ')[0];
  document.getElementById('moodResultText').textContent = 'Você está ' + mood.label;
  document.getElementById('moodResultMsg').textContent = mood.message;
  resultEl.style.borderColor = mood.borderColor;
  resultEl.style.background = mood.color + '22';
  resultEl.classList.add('show');

  document.getElementById('moodConfirmBtn').disabled = true;
  state.stars += 1;
  updateStars();
  playCelebration();
  renderMoodHistory();
}

function renderMoodHistory() {
  const list = document.getElementById('moodHistoryList');
  if (moodHistory.length === 0) {
    list.innerHTML = '<p style="color:var(--text-soft);font-weight:700">Ainda não registrou seu humor hoje.</p>';
    return;
  }
  list.innerHTML = moodHistory.map(entry => `
    <div class="mood-history-item">
      <div class="mood-history-dot" style="background:${entry.mood.color}"></div>
      <span style="font-size:1.4rem">${entry.mood.label.split(' ')[0]}</span>
      <span style="flex:1;font-weight:800">${entry.mood.label}</span>
      <span style="color:var(--text-soft);font-size:0.9rem">${entry.time}</span>
    </div>
  `).join('');
}

// ===== TASK AUDIO =====
let currentAudio = null;
let activeAudioTaskId = null;

function playTaskAudio(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.audio || !state.soundOn) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (activeAudioTaskId) {
      const oldBtn = document.getElementById('audiobtn-' + activeAudioTaskId);
      if (oldBtn) oldBtn.classList.remove('playing');
    }
    if (activeAudioTaskId === taskId) {
      currentAudio = null;
      activeAudioTaskId = null;
      return;
    }
  }

  currentAudio = new Audio(task.audio);
  activeAudioTaskId = taskId;
  const btn = document.getElementById('audiobtn-' + taskId);
  if (btn) btn.classList.add('playing');

  currentAudio.play().catch(() => {});
  currentAudio.onended = () => {
    if (btn) btn.classList.remove('playing');
    currentAudio = null;
    activeAudioTaskId = null;
  };
}

function setTaskAudioFile(taskId, input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.audio = e.target.result;
      renderTasks();
      renderCareTaskList();
    }
  };
  reader.readAsDataURL(input.files[0]);
}

function removeTaskAudio(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    if (currentAudio && activeAudioTaskId === taskId) {
      currentAudio.pause(); currentAudio = null; activeAudioTaskId = null;
    }
    task.audio = null;
    renderTasks();
    renderCareTaskList();
  }
}

// --- Recording for existing tasks ---
let taskMediaRecorder = null;
let taskAudioChunks = [];
let recordingTaskId = null;

function toggleTaskRecording(taskId) {
  if (taskMediaRecorder && taskMediaRecorder.state === 'recording') {
    if (recordingTaskId === taskId) {
      taskMediaRecorder.stop();
    } else {
      // Stop other recording first
      taskMediaRecorder.stop();
      setTimeout(() => startTaskRecording(taskId), 300);
    }
    return;
  }
  startTaskRecording(taskId);
}

function startTaskRecording(taskId) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    taskAudioChunks = [];
    recordingTaskId = taskId;
    taskMediaRecorder = new MediaRecorder(stream);

    const btn = document.getElementById('rec-btn-' + taskId);
    if (btn) { btn.classList.add('recording'); btn.innerHTML = '<span class="rec-dot"></span> Parar'; }

    taskMediaRecorder.ondataavailable = e => { if (e.data.size > 0) taskAudioChunks.push(e.data); };
    taskMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(taskAudioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = (ev) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.audio = ev.target.result;
          renderTasks();
          renderCareTaskList();
        }
      };
      reader.readAsDataURL(blob);
      recordingTaskId = null;
      taskMediaRecorder = null;
    };
    taskMediaRecorder.start();
  }).catch(() => {
    alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
  });
}

// --- Recording for new task form ---
let newTaskMediaRecorder = null;
let newTaskAudioChunks = [];
let isNewTaskRecording = false;

function toggleNewTaskRecording() {
  if (isNewTaskRecording) {
    stopNewTaskRecording();
  } else {
    startNewTaskRecording();
  }
}

function startNewTaskRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    newTaskAudioChunks = [];
    isNewTaskRecording = true;
    newTaskMediaRecorder = new MediaRecorder(stream);

    const btn = document.getElementById('newRecordBtn');
    if (btn) { btn.classList.add('recording'); btn.innerHTML = '<span class="rec-dot"></span> ⏹ Parar'; }

    newTaskMediaRecorder.ondataavailable = e => { if (e.data.size > 0) newTaskAudioChunks.push(e.data); };
    newTaskMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      isNewTaskRecording = false;
      const blob = new Blob(newTaskAudioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('newTaskAudioData').value = ev.target.result;
        showNewAudioPreview('voz gravada');
      };
      reader.readAsDataURL(blob);
      const btn = document.getElementById('newRecordBtn');
      if (btn) { btn.classList.remove('recording'); btn.innerHTML = '<span class="rec-dot"></span> Gravar voz'; }
      newTaskMediaRecorder = null;
    };
    newTaskMediaRecorder.start();
  }).catch(() => {
    alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    isNewTaskRecording = false;
  });
}

function stopNewTaskRecording() {
  if (newTaskMediaRecorder && newTaskMediaRecorder.state === 'recording') {
    newTaskMediaRecorder.stop();
  }
  isNewTaskRecording = false;
  const btn = document.getElementById('newRecordBtn');
  if (btn) { btn.classList.remove('recording'); btn.innerHTML = '<span class="rec-dot"></span> Gravar voz'; }
}

function previewNewTaskAudio(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('newTaskAudioData').value = e.target.result;
    showNewAudioPreview(file.name.length > 20 ? file.name.substring(0,18)+'...' : file.name);
    document.getElementById('newAudioUploadBtn').classList.add('has-audio');
  };
  reader.readAsDataURL(file);
}

let previewAudioEl = null;
function showNewAudioPreview(name) {
  document.getElementById('newAudioName').textContent = name;
  document.getElementById('newAudioPreview').style.display = 'flex';
}

function playPreviewAudio() {
  const dataUrl = document.getElementById('newTaskAudioData').value;
  if (!dataUrl) return;
  if (previewAudioEl) { previewAudioEl.pause(); previewAudioEl.currentTime = 0; }
  previewAudioEl = new Audio(dataUrl);
  previewAudioEl.play().catch(() => {});
}

function removeNewTaskAudio() {
  if (previewAudioEl) { previewAudioEl.pause(); previewAudioEl = null; }
  document.getElementById('newTaskAudioData').value = '';
  document.getElementById('newAudioPreview').style.display = 'none';
  document.getElementById('newAudioUploadBtn').classList.remove('has-audio');
}

// ===== INIT =====
renderTasks();
renderCareTaskList();
