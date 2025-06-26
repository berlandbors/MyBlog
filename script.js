const resultsDiv = document.getElementById('results');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalFrame = document.getElementById('modal-frame');
const counter = document.getElementById('gallery-counter');

let gallery = [];
let galleryIndex = 0;

async function search() {
  const mode = document.getElementById('mode').value;
  const q = document.getElementById('query').value.trim();
  if (!q) return alert('Введите запрос');
  resultsDiv.innerHTML = '🔄 Поиск...';

  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}+AND+mediatype:${mode}&fl[]=identifier,title,creator,description&sort[]=downloads+desc&rows=50&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data.response.docs;

  if (docs.length === 0) return resultsDiv.innerHTML = '❌ Ничего не найдено';

  resultsDiv.innerHTML = '';
  docs.forEach(doc => {
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `
      <b>${doc.title || doc.identifier}</b><br>
      👤 ${doc.creator || '—'}<br>
      📝 ${doc.description?.slice(0, 200) || 'Нет описания'}...
      <br><i>🔽 Нажмите, чтобы открыть</i>
    `;
    div.onclick = () => openItem(doc.identifier, mode);
    resultsDiv.appendChild(div);
  });
}

async function openItem(id, mode) {
  const meta = await fetch(`https://archive.org/metadata/${id}`).then(r => r.json());
  const base = `https://archive.org/download/${id}/`;

  if (mode === 'image') {
    gallery = meta.files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f.name));
    if (gallery.length === 0) return alert('❌ Нет изображений');
    gallery = gallery.map(f => base + f.name);
    galleryIndex = 0;
    showGalleryImage();
  } else {
    const file = meta.files.find(f => /\.pdf$/i.test(f.name)) || meta.files.find(f => /\.epub$/i.test(f.name));
    if (!file) return alert('❌ Нет PDF или EPUB');
    modalFrame.src = base + file.name;
    modalFrame.style.display = '';
    modalImg.style.display = 'none';
    counter.textContent = '';
  }

  modal.dataset.id = id;
  modal.dataset.mode = mode;
  modal.style.display = 'flex';
}

function showGalleryImage() {
  modalImg.src = gallery[galleryIndex];
  modalImg.style.display = '';
  modalFrame.style.display = 'none';
  counter.textContent = `🖼 ${galleryIndex + 1} из ${gallery.length}`;
}

function prevImage() {
  if (!gallery.length) return;
  galleryIndex = (galleryIndex - 1 + gallery.length) % gallery.length;
  showGalleryImage();
}

function nextImage() {
  if (!gallery.length) return;
  galleryIndex = (galleryIndex + 1) % gallery.length;
  showGalleryImage();
}

function closeModal() {
  modal.style.display = 'none';
  modalImg.src = '';
  modalFrame.src = '';
  gallery = [];
}

function shareItem() {
  const id = modal.dataset.id;
  const mode = modal.dataset.mode;
  const url = new URL(window.location.href);
  url.searchParams.set(mode === 'image' ? 'image' : 'book', id);
  navigator.clipboard.writeText(url).then(() => alert('✅ Скопировано!'));
}

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('book') || params.get('image');
  if (id) {
    const mode = params.has('image') ? 'image' : 'texts';
    document.getElementById('mode').value = mode;
    openItem(id, mode);
  }
});

window.addEventListener('keydown', e => {
  if (modal.style.display !== 'flex') return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') prevImage();
});