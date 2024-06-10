const { desktopCapturer, dialog } = require('electron');
const { writeFile } = require('fs');
const { Menu } = require('@electron/remote');

let mediaRecorder; 
const recordedChunks = [];
const videoElement = document.querySelector('Відео');
const startBtn = document.getElementById('Старт');
const stopBtn = document.getElementById('Зупинити');
const videoSelectBtn = document.getElementById('Виберіть відео');
const playBtn = document.getElementById('Відтворити');  
const saveBtn = document.getElementById('Зберігти');  

// Выбор источника видео
videoSelectBtn.onclick = getVideoSources;

// Выбор источника видео
startBtn.onclick = e => {
  if (mediaRecorder && mediaRecorder.state === 'inactive') {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Запис';
  }
};

// Остановка записи
stopBtn.onclick = e => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Старт';
  }
};

// Воспроизведение записанного видео
playBtn.onclick = e => {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });
  const url = URL.createObjectURL(blob);
  videoElement.src = url;
  videoElement.play();
};

// Сохранение видео
saveBtn.onclick = async e => {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Зберегти відео',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('Відео успішно збережено!'));
  }
};

// Функции для записи видео
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

//Выбор видео
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Зберегти відео',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('Відео успішно збережено!'));
  }
}
