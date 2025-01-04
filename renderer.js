const fs = require('fs');
const path = require('path');

// Paths to our JSON "database" files
const coursesPath = path.join(__dirname, 'db', 'courses.json');
const textbooksPath = path.join(__dirname, 'db', 'textbooks.json');
const originalTextPath = path.join(__dirname, 'db', 'originalTextInput.json');
const notesPath = path.join(__dirname, 'db', 'notes.json');

// ---------------------------------------------------------------------
// Utility Functions for Reading/Writing JSON
// ---------------------------------------------------------------------
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    // If file doesn't exist, return an empty array
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing JSON from ${filePath}:`, e);
    return [];
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate next ID by looking for the max ID in the array
function getNextId(array) {
  if (array.length === 0) return 1;
  return Math.max(...array.map(item => item.id)) + 1;
}

// ---------------------------------------------------------------------
// Global Data
// ---------------------------------------------------------------------
let courses = loadJson(coursesPath);
let textbooks = loadJson(textbooksPath);
let originalTexts = loadJson(originalTextPath);
let notes = loadJson(notesPath);

// ---------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------
const newCourseNameInput = document.getElementById('newCourseName');
const addCourseBtn = document.getElementById('addCourseBtn');

const courseSelectForTextbook = document.getElementById('courseSelectForTextbook');
const newTextbookNameInput = document.getElementById('newTextbookName');
const addTextbookBtn = document.getElementById('addTextbookBtn');

const courseSelect = document.getElementById('courseSelect');
const textbookSelect = document.getElementById('textbookSelect');

const originalTextInput = document.getElementById('originalTextInput');
const addOriginalTextBtn = document.getElementById('addOriginalTextBtn');

const textNotesTableBody = document.getElementById('textNotesTableBody');

// ---------------------------------------------------------------------
// Initial Load
// ---------------------------------------------------------------------
populateCourseDropdowns();
populateTextbookDropdowns();

// ---------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------
addCourseBtn.addEventListener('click', () => {
  const courseName = newCourseNameInput.value.trim();
  if (courseName) {
    const newId = getNextId(courses);
    courses.push({ id: newId, courseName });
    saveJson(coursesPath, courses);
    newCourseNameInput.value = '';
    populateCourseDropdowns();
    populateTextbookDropdowns();
  }
});

addTextbookBtn.addEventListener('click', () => {
  const courseId = parseInt(courseSelectForTextbook.value, 10);
  const textbookName = newTextbookNameInput.value.trim();
  if (!courseId) {
    alert('Please select a course to add the textbook to.');
    return;
  }
  if (textbookName) {
    const newId = getNextId(textbooks);
    textbooks.push({ id: newId, courseId, textbookName });
    saveJson(textbooksPath, textbooks);
    newTextbookNameInput.value = '';
    populateTextbookDropdowns();
  }
});

courseSelect.addEventListener('change', () => {
  populateTextbookDropdowns();
  renderTextNotesTable();
});

textbookSelect.addEventListener('change', () => {
  renderTextNotesTable();
});

addOriginalTextBtn.addEventListener('click', () => {
  const courseId = parseInt(courseSelect.value, 10);
  const textbookId = parseInt(textbookSelect.value, 10);
  const text = originalTextInput.value.trim();
  if (!courseId || !textbookId) {
    alert('Please select a course and a textbook first.');
    return;
  }
  if (!text) {
    alert('Please enter some text to add.');
    return;
  }
  const newId = getNextId(originalTexts);
  originalTexts.push({
    id: newId,
    courseId,
    textbookId,
    originalText: text
  });
  saveJson(originalTextPath, originalTexts);
  originalTextInput.value = '';
  renderTextNotesTable();
});

// ---------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------
function populateCourseDropdowns() {
  // For "Add Textbook" dropdown
  courseSelectForTextbook.innerHTML = '';
  courses.forEach(course => {
    const opt = document.createElement('option');
    opt.value = course.id;
    opt.textContent = course.courseName;
    courseSelectForTextbook.appendChild(opt);
  });

  // For "Select Course" in reading flow
  const currentCourseId = parseInt(courseSelect.value, 10);
  courseSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '--Select a Course--';
  courseSelect.appendChild(defaultOption);

  courses.forEach(course => {
    const opt = document.createElement('option');
    opt.value = course.id;
    opt.textContent = course.courseName;
    courseSelect.appendChild(opt);
  });

  // Keep the same selection if possible
  if (currentCourseId) {
    courseSelect.value = currentCourseId;
  }
}

function populateTextbookDropdowns() {
  const selectedCourseId = parseInt(courseSelect.value, 10);

  // For "Select Textbook" in reading flow
  const currentTextbookId = parseInt(textbookSelect.value, 10);
  textbookSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '--Select a Textbook--';
  textbookSelect.appendChild(defaultOption);

  textbooks
    .filter(tb => tb.courseId === selectedCourseId)
    .forEach(tb => {
      const opt = document.createElement('option');
      opt.value = tb.id;
      opt.textContent = tb.textbookName;
      textbookSelect.appendChild(opt);
    });

  // Keep the same selection if possible
  if (currentTextbookId) {
    textbookSelect.value = currentTextbookId;
  }
}

function renderTextNotesTable() {
  textNotesTableBody.innerHTML = '';
  const courseId = parseInt(courseSelect.value, 10);
  const textbookId = parseInt(textbookSelect.value, 10);

  if (!courseId || !textbookId) {
    return; // Nothing to show
  }

  // Filter originalTexts
  const relevantTexts = originalTexts.filter(
    item => item.courseId === courseId && item.textbookId === textbookId
  );

  // Sort by ID or by insertion (chronological)
  // If you want them strictly chronological by ID, we can do:
  relevantTexts.sort((a, b) => a.id - b.id);

  relevantTexts.forEach(textObj => {
    const row = document.createElement('tr');
    
    // Column 1: Original Text
    const textTd = document.createElement('td');
    textTd.textContent = textObj.originalText;
    row.appendChild(textTd);

    // Column 2: Existing notes
    const existingNotesTd = document.createElement('td');
    const relatedNotes = notes
      .filter(note => note.courseId === courseId 
                   && note.textbookId === textbookId 
                   && note.originalTextInputId === textObj.id);
    // Sort by noteAddedTime
    relatedNotes.sort((a, b) => a.noteAddedTime - b.noteAddedTime);

    if (relatedNotes.length === 0) {
      existingNotesTd.textContent = 'No notes yet';
    } else {
      const notesList = document.createElement('ul');
      relatedNotes.forEach(n => {
        const noteLi = document.createElement('li');
        noteLi.textContent = n.noteText + ` (at ${new Date(n.noteAddedTime * 1000).toLocaleString()})`;
        notesList.appendChild(noteLi);
      });
      existingNotesTd.appendChild(notesList);
    }
    row.appendChild(existingNotesTd);

    // Column 3: New note text box
    const newNoteTd = document.createElement('td');
    const newNoteInput = document.createElement('input');
    newNoteInput.type = 'text';
    newNoteInput.placeholder = 'Enter new note';
    newNoteTd.appendChild(newNoteInput);
    row.appendChild(newNoteTd);

    // Column 4: Button
    const actionTd = document.createElement('td');
    const addNoteBtn = document.createElement('button');
    addNoteBtn.textContent = 'Add Note';
    addNoteBtn.addEventListener('click', () => {
      const noteText = newNoteInput.value.trim();
      if (noteText) {
        const newId = getNextId(notes);
        const unixTimeSeconds = Math.floor(Date.now() / 1000);
        notes.push({
          id: newId,
          courseId,
          textbookId,
          originalTextInputId: textObj.id,
          noteAddedTime: unixTimeSeconds,
          noteText
        });
        saveJson(notesPath, notes);
        newNoteInput.value = '';
        renderTextNotesTable(); // refresh
      }
    });
    actionTd.appendChild(addNoteBtn);
    row.appendChild(actionTd);

    textNotesTableBody.appendChild(row);
  });
}