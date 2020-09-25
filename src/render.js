const {desktopCapturer, remote} = require('electron');
const {writeFile} = require('fs');
const {dialog, Menu} = remote;

let mediaRecorder;
const recordedChunks = [];

const videoElement = document.querySelector('video');
const startRecordingButton = document.getElementById('startRecordingButton');
const stopRecordingButton = document.getElementById('stopRecordingButton');
const selectVideoButton = document.getElementById('selectVideoButton');

startRecordingButton.onclick = e => {
    mediaRecorder.start();
    startRecordingButton.classList.add('is-danger');
    startRecordingButton.innerText = 'Recording';
};

stopRecordingButton.onclick = e => {
    mediaRecorder.stop();
    stopRecordingButton.classList.remove('is-danger')
    startRecordingButton.innerText = 'Start';
};

selectVideoButton.onclick = getVideoSources;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoSourcesMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoSourcesMenu.popup();
}

async function selectSource(source) {

    selectVideoButton.innerText = source.name;
  
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id
        }
      }
    };
  

    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);
  
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
  
  }

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
  
    const buffer = Buffer.from(await blob.arrayBuffer());
  
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save video',
      defaultPath: `vid-${Date.now()}.mp4`
    });
  
    if (filePath) {
      writeFile(filePath, buffer, () => console.log('video saved'));
    }
  
  }