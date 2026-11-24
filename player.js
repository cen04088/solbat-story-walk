'use strict';

const byId = (id) => document.getElementById(id);
const art = document.querySelector('.art');
const buttons = [...document.querySelectorAll('[data-stop]')];
const audio = byId('audio');
const previous = byId('previous');
const play = byId('play');
const next = byId('next');
const seek = byId('seek');
const time = byId('time');
const locate = byId('gps');
const status = byId('status');
const textDialog = byId('text-dialog');

let tracks;
let active = 1;
let request = 0;
let statusTimer;

// Approximate centers aligned to the official guide with OSM park boundary 381651421.
const locations = [
  { latitude: 37.65185, longitude: 127.01245 },
  { latitude: 37.65241, longitude: 127.01096 },
  { latitude: 37.65301, longitude: 127.01050 },
  { latitude: 37.65306, longitude: 127.01116 },
];
// Latitude and longitude from the OpenStreetMap park outline.
const parkBoundary = [
  [37.6538746, 127.0121916],
  [37.6537596, 127.0126211],
  [37.6535028, 127.0126089],
  [37.6535125, 127.0125041],
  [37.6531320, 127.0123932],
  [37.6531076, 127.0125103],
  [37.6525075, 127.0124240],
  [37.6518245, 127.0124610],
  [37.6516635, 127.0119372],
  [37.6516781, 127.0118817],
  [37.6519952, 127.0113518],
  [37.6523172, 127.0106801],
  [37.6524197, 127.0105899],
  [37.6526441, 127.0104583],
  [37.6528173, 127.0103689],
  [37.6529379, 127.0102897],
  [37.6530100, 127.0102395],
  [37.6533881, 127.0104706],
  [37.6532320, 127.0110499],
  [37.6531881, 127.0112994],
  [37.6532491, 127.0113395],
  [37.6534198, 127.0113179],
  [37.6535540, 127.0112470],
  [37.6536824, 127.0111779],
  [37.6537388, 127.0111631],
  [37.6538326, 127.0111454],
  [37.6538590, 127.0111096],
  [37.6541160, 127.0113013],
];
const maxPositionError = 65;

function isInPark({ latitude, longitude }) {
  let inside = false;
  let [previousLatitude, previousLongitude] = parkBoundary.at(-1);
  for (const [edgeLatitude, edgeLongitude] of parkBoundary) {
    if ((edgeLatitude > latitude) !== (previousLatitude > latitude)) {
      const longitudeAtLatitude = edgeLongitude + (previousLongitude - edgeLongitude)
        * (latitude - edgeLatitude) / (previousLatitude - edgeLatitude);
      if (longitude < longitudeAtLatitude) inside = !inside;
    }
    previousLatitude = edgeLatitude;
    previousLongitude = edgeLongitude;
  }
  return inside;
}

function showStatus(message, duration) {
  clearTimeout(statusTimer);
  status.textContent = message;
  statusTimer = duration ? setTimeout(() => { status.textContent = ''; }, duration) : undefined;
}

function closestStop({ latitude, longitude }) {
  const latitudeScale = 111195;
  const longitudeScale = latitudeScale * Math.cos(latitude * Math.PI / 180);
  let closest = { index: -1, meters: Infinity };
  locations.forEach((point, index) => {
    const meters = Math.hypot((point.latitude - latitude) * latitudeScale, (point.longitude - longitude) * longitudeScale);
    if (meters < closest.meters) closest = { index, meters };
  });
  return closest;
}

function formatTime(seconds) {
  const whole = Math.floor(seconds || 0);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}

function syncPlayer() {
  const playing = !audio.paused && !audio.ended;
  art.classList.toggle('is-playing', playing);
  play.textContent = playing ? 'Ⅱ' : '▶';
  play.setAttribute('aria-label', playing ? '일시정지' : '재생');
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  seek.disabled = duration <= 0;
  seek.max = duration || 1;
  seek.value = audio.currentTime;
  seek.setAttribute('aria-valuetext', formatTime(audio.currentTime) + ' / ' + formatTime(duration));
  time.textContent = formatTime(audio.currentTime) + (duration ? ' / ' + formatTime(duration) : '');
}

function selectTrack(index) {
  const track = tracks[index];
  if (!track) return;
  active = index;
  const number = String(index + 1).padStart(2, '0');
  if (audio.getAttribute('src') !== track.audio) {
    audio.pause();
    audio.src = track.audio;
    audio.load();
  }
  art.dataset.album = index;
  byId('cover-number').textContent = number;
  byId('disc-number').textContent = number;
  byId('cover-name').textContent = track.name;
  byId('story-title').textContent = track.title;
  byId('cue').textContent = track.cue;
  byId('text-title').textContent = track.title + ' 자막';
  byId('lines').replaceChildren(...track.lines.map((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    return paragraph;
  }));
  buttons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.stop) === index)));
  previous.disabled = index === 0;
  next.disabled = index === tracks.length - 1;
  syncPlayer();
}

function choose(index) {
  request += 1;
  locate.disabled = false;
  showStatus('');
  selectTrack(index);
}

function locateOnce() {
  if (!navigator.geolocation) {
    showStatus('이 브라우저에서는 위치를 확인할 수 없습니다. 미니맵에서 지점을 선택하세요.');
    return;
  }
  const id = ++request;
  locate.disabled = true;
  showStatus('현재 위치를 확인하는 중입니다.');
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    if (id !== request) return;
    locate.disabled = false;
    if (!isInPark(coords)) {
      showStatus('현재 공원이 아닙니다', 2500);
      return;
    }
    if (!Number.isFinite(coords.accuracy) || coords.accuracy > maxPositionError) {
      showStatus('위치 오차가 큽니다. 다시 확인하거나 미니맵에서 지점을 선택하세요.');
      return;
    }
    const nearby = closestStop(coords);
    selectTrack(nearby.index);
    showStatus('현재 위치 추천 · ' + tracks[nearby.index].name);
  }, (error) => {
    if (id !== request) return;
    locate.disabled = false;
    showStatus(error.code === 1
      ? '위치 접근을 허용하지 않았습니다. 미니맵에서 지점을 선택할 수 있습니다.'
      : '현재 위치를 확인하지 못했습니다. 미니맵에서 지점을 선택할 수 있습니다.');
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });
}

for (const event of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'emptied', 'durationchange']) {
  audio.addEventListener(event, syncPlayer);
}
audio.addEventListener('error', () => {
  syncPlayer();
  showStatus('음성을 재생할 수 없습니다. 자막에서 이야기를 읽을 수 있습니다.');
});

seek.addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value);
});
play.addEventListener('click', () => {
  if (!audio.paused && !audio.ended) {
    audio.pause();
    return;
  }
  const track = active;
  audio.play().catch((error) => {
    if (active === track && error.name !== 'AbortError') {
      showStatus('음성을 재생할 수 없습니다. 자막에서 이야기를 읽을 수 있습니다.');
    }
  });
});
byId('open-text').addEventListener('click', () => textDialog.showModal());
byId('open-credits').addEventListener('click', () => byId('credits-dialog').showModal());

fetch('park-stories.json').then((response) => {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}).then((stories) => {
  tracks = stories;
  selectTrack(active);
  play.disabled = locate.disabled = false;
  buttons.forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => choose(Number(button.dataset.stop)));
  });
  previous.addEventListener('click', () => choose(active - 1));
  next.addEventListener('click', () => choose(active + 1));
  locate.addEventListener('click', locateOnce);
}).catch(() => {
  showStatus('이야기 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
});
