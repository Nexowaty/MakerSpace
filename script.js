class Router {
    constructor() {
        this.views = document.querySelectorAll('.view');
        this.btns = document.querySelectorAll('.nav-btn[data-target]');
        this.init();
    }

    init() {
        this.btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                this.navigate(target);
            });
        });
    }

    navigate(targetId) {
        this.btns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === targetId);
        });

        this.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${targetId}`) {
                view.classList.add('active');
            }
        });
    }
}

class LocalizationManager {
    constructor(data) {
        this.translations = data.translations;
        this.currentLang = localStorage.getItem('makerLanguage') || 'en';
        this.init();
    }

    init() {
        this.setLanguage(this.currentLang);

        // Modal Events
        const modal = document.getElementById('settings-modal');
        const openBtn = document.getElementById('settings-btn');
        const closeBtn = document.getElementById('close-settings');
        const langSelect = document.getElementById('language-select');

        if (openBtn) openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            langSelect.value = this.currentLang;
        });

        if (closeBtn) closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        if (langSelect) langSelect.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
    }

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('makerLanguage', lang);

        const dict = this.translations[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (dict[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key];
                } else {
                    el.innerText = dict[key];
                }
            }
        });
    }
}

class MemeGenerator {
    constructor(data) {
        this.canvas = document.getElementById('meme-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.templates = data.memes;
        this.currentImage = null;
        this.textTop = '';
        this.textBottom = '';

        this.init();
    }

    init() {
        const container = document.getElementById('meme-templates');

        this.templates.forEach(t => {
            const img = document.createElement('img');
            img.src = t.url;
            img.classList.add('template-thumb');
            img.onclick = () => this.loadTemplate(t.url, img);
            container.appendChild(img);
        });

        document.getElementById('meme-text-top').addEventListener('input', (e) => {
            this.textTop = e.target.value;
            this.draw();
        });
        document.getElementById('meme-text-bottom').addEventListener('input', (e) => {
            this.textBottom = e.target.value;
            this.draw();
        });

        document.getElementById('meme-upload-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => this.loadTemplate(evt.target.result);
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });

        document.getElementById('meme-download').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'meme.png';
            link.href = this.canvas.toDataURL();
            link.click();
            App.history.add({ type: 'Meme', date: new Date().toLocaleTimeString() });
        });

        if (this.templates.length > 0) {
            this.loadTemplate(this.templates[0].url, container.firstChild);
        }
    }

    loadTemplate(url, thumbElement = null) {
        if (thumbElement) {
            document.querySelectorAll('.template-thumb').forEach(t => t.classList.remove('selected'));
            thumbElement.classList.add('selected');
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            this.currentImage = img;
            this.resizeCanvas(img.width, img.height);
            this.draw();
        };
        img.src = url;
    }

    resizeCanvas(w, h) {
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / w);
        this.canvas.width = w * scale;
        this.canvas.height = h * scale;
    }

    draw() {
        if (!this.currentImage) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.drawImage(this.currentImage, 0, 0, w, h);

        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = w / 150;
        this.ctx.textAlign = 'center';

        const fontSize = w / 10;
        this.ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;

        this.ctx.textBaseline = 'top';
        this.wrapText(this.textTop.toUpperCase(), w / 2, 10, w - 20, fontSize);

        this.ctx.textBaseline = 'bottom';
        this.wrapText(this.textBottom.toUpperCase(), w / 2, h - 10, w - 20, fontSize);
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        const isBottom = this.ctx.textBaseline === 'bottom';
        let yPos = isBottom ? y - (words.length > 5 ? lineHeight * 2 : 0) : y;

        this.ctx.fillText(text, x, y);
        this.ctx.strokeText(text, x, y);
    }
}

class AvatarGenerator {
    constructor(data) {
        this.canvas = document.getElementById('avatar-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.data = data.avatar_options;
        this.state = {
            face: 0,
            eyes: 0,
            hair: 0,
            facial_hair: 0,
            clothes: 0,
            acce: 0
        };
        this.init();
    }

    init() {
        this.renderOptions('face');

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderOptions(btn.dataset.tab);
            });
        });

        document.getElementById('avatar-randomize').addEventListener('click', () => this.randomize());
        document.getElementById('avatar-download').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'avatar.png';
            link.href = this.canvas.toDataURL();
            link.click();
            App.history.add({ type: 'Avatar', date: new Date().toLocaleTimeString() });
        });

        this.draw();
    }

    renderOptions(category) {
        const container = document.getElementById('avatar-options-face');
        container.innerHTML = '';

        let options = [];
        if (category === 'face') options = this.data.face;
        else if (category === 'eyes') options = this.data.eyes;
        else if (category === 'hair') options = this.data.hair;
        else if (category === 'facial_hair') options = this.data.facial_hair;
        else if (category === 'clothes') options = this.data.clothes;
        else if (category === 'acce') options = this.data.accessories;

        options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.innerText = typeof opt === 'string' && opt.startsWith('#') ? '' : opt;
            div.style.backgroundColor = typeof opt === 'string' && opt.startsWith('#') ? opt : 'transparent';
            if (typeof opt === 'string' && !opt.startsWith('#')) {
                div.style.border = '1px solid currentColor';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.fontSize = '0.7rem';
            }

            if (this.state[category] === idx) div.classList.add('selected');

            div.onclick = () => {
                this.state[category] = idx;
                this.renderOptions(category);
                this.draw();
            };
            container.appendChild(div);
        });
    }

    randomize() {
        this.state.face = Math.floor(Math.random() * this.data.face.length);
        this.state.eyes = Math.floor(Math.random() * this.data.eyes.length);
        this.state.hair = Math.floor(Math.random() * this.data.hair.length);
        this.state.facial_hair = Math.floor(Math.random() * this.data.facial_hair.length);
        this.state.clothes = Math.floor(Math.random() * this.data.clothes.length);
        this.state.acce = Math.floor(Math.random() * this.data.accessories.length);
        this.draw();

        const activeTabBtn = document.querySelector('.tab-btn.active');
        if (activeTabBtn) this.renderOptions(activeTabBtn.dataset.tab);
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2 + 20;

        const clothesType = this.data.clothes[this.state.clothes];

        ctx.fillStyle = '#333';
        if (clothesType === 'tshirt') ctx.fillStyle = '#e74c3c';
        else if (clothesType === 'hoodie') ctx.fillStyle = '#3498db';
        else if (clothesType === 'suit') ctx.fillStyle = '#2c3e50';
        else if (clothesType === 'dress') ctx.fillStyle = '#9b59b6';

        if (clothesType !== 'none') {
            ctx.beginPath();
            ctx.arc(cx, cy + 140, 100, Math.PI, 0);
            ctx.rect(cx - 100, cy + 140, 200, 120);
            ctx.fill();

            if (clothesType === 'suit') {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.moveTo(cx, cy + 140); ctx.lineTo(cx - 20, cy + 100); ctx.lineTo(cx + 20, cy + 100); ctx.fill();
                ctx.fillStyle = '#c0392b';
                ctx.beginPath(); ctx.moveTo(cx, cy + 100); ctx.lineTo(cx - 5, cy + 160); ctx.lineTo(cx + 5, cy + 160); ctx.fill();
            }
            else if (clothesType === 'hoodie') {
                ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(cx, cy + 120); ctx.lineTo(cx, cy + 200); ctx.stroke();
            }
        }

        const faceColor = this.data.face[this.state.face] || '#ffdbac';
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();

        const facialHair = this.data.facial_hair[this.state.facial_hair];
        ctx.fillStyle = '#222';

        if (facialHair === 'stubble') {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath(); ctx.arc(cx, cy + 30, 80, 0, Math.PI); ctx.fill();
        } else if (facialHair === 'moustache') {
            ctx.strokeStyle = '#222'; ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(cx - 30, cy + 60); ctx.quadraticCurveTo(cx, cy + 40, cx + 30, cy + 60); ctx.stroke();
        } else if (facialHair === 'beard') {
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI); ctx.fill();
            ctx.fillStyle = faceColor;
            ctx.beginPath(); ctx.arc(cx, cy + 50, 30, 0, Math.PI * 2); ctx.fill();
        } else if (facialHair === 'goatee') {
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(cx, cy + 120, 20, 0, Math.PI * 2); ctx.fill();
        }

        const eyeType = this.data.eyes[this.state.eyes];
        ctx.fillStyle = '#fff';

        if (eyeType === 'sunglasses') {
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 70, cy - 40, 60, 30);
            ctx.fillRect(cx + 10, cy - 40, 60, 30);
            ctx.fillRect(cx - 10, cy - 35, 20, 5);
        } else if (eyeType === 'wink') {
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(cx + 20, cy - 20); ctx.lineTo(cx + 60, cy - 20); ctx.stroke();
        } else if (eyeType === 'happy') {
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 20, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 20, Math.PI, 0); ctx.stroke();
        } else if (eyeType === 'sleepy') {
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx - 60, cy - 20); ctx.lineTo(cx - 20, cy - 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 20, cy - 20); ctx.lineTo(cx + 60, cy - 20); ctx.stroke();
        } else if (eyeType === 'laser') {
            ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 20, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 20, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'red'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(cx - 40, cy - 20); ctx.lineTo(0, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 40, cy - 20); ctx.lineTo(w, h); ctx.stroke();
        } else if (eyeType === 'surprised') {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 25, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 25, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 5, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 20, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(cx - 40, cy - 20, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 8, 0, Math.PI * 2); ctx.fill();
        }

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (eyeType === 'happy') {
            ctx.arc(cx, cy + 50, 40, 0, Math.PI, false);
        } else if (eyeType === 'surprised') {
            ctx.arc(cx, cy + 60, 20, 0, Math.PI * 2);
        } else {
            ctx.arc(cx, cy + 50, 40, 0.2, Math.PI - 0.2, false);
        }
        ctx.stroke();

        const hairType = this.data.hair[this.state.hair];
        ctx.fillStyle = '#222';

        if (hairType === 'afro') {
            ctx.beginPath(); ctx.arc(cx, cy - 60, 140, 0, Math.PI * 2); ctx.fill();
        } else if (hairType === 'mohawk') {
            ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.rect(cx - 20, cy - 200, 40, 150); ctx.fill();
        } else if (hairType === 'long') {
            ctx.beginPath(); ctx.arc(cx, cy, 130, Math.PI, 0); ctx.fill();
            ctx.fillRect(cx - 130, cy, 260, 200);
        } else if (hairType === 'bald') {
        } else if (hairType === 'spiky') {
            ctx.beginPath();
            ctx.moveTo(cx - 100, cy - 50);
            ctx.lineTo(cx - 50, cy - 150); ctx.lineTo(cx, cy - 80);
            ctx.lineTo(cx + 50, cy - 150); ctx.lineTo(cx + 100, cy - 50);
            ctx.fill();
        } else if (hairType === 'bun') {
            ctx.beginPath(); ctx.arc(cx, cy - 80, 120, Math.PI, 0); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy - 140, 40, 0, Math.PI * 2); ctx.fill();
        } else if (hairType === 'bob') {
            ctx.beginPath(); ctx.moveTo(cx - 120, cy + 60); ctx.quadraticCurveTo(cx, cy - 120, cx + 120, cy + 60); ctx.fill();
            ctx.fillRect(cx - 120, cy, 240, 100);
        } else {
            ctx.beginPath(); ctx.arc(cx, cy - 20, 125, Math.PI, 0); ctx.fill();
        }

        const acceType = this.data.accessories[this.state.acce];
        ctx.fillStyle = 'rgba(0,0,0,0.5)';

        if (acceType === 'glasses') {
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 70, cy - 40, 60, 30);
            ctx.fillRect(cx + 10, cy - 40, 60, 30);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000';
            ctx.beginPath(); ctx.moveTo(cx - 70, cy - 25); ctx.lineTo(cx - 100, cy - 35); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 70, cy - 25); ctx.lineTo(cx + 100, cy - 35); ctx.stroke();
            ctx.fillRect(cx - 10, cy - 35, 20, 5);
        } else if (acceType === 'mask') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 60, cy + 20, 120, 80);
            ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - 60, cy + 40); ctx.lineTo(cx - 100, cy + 30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 60, cy + 40); ctx.lineTo(cx + 100, cy + 30); ctx.stroke();
        } else if (acceType === 'earring') {
            ctx.fillStyle = 'gold';
            ctx.beginPath(); ctx.arc(cx - 120, cy + 60, 10, 0, Math.PI * 2); ctx.fill();
        } else if (acceType === 'hat') {
            ctx.fillStyle = '#444';
            ctx.fillRect(cx - 130, cy - 120, 260, 20);
            ctx.fillRect(cx - 80, cy - 180, 160, 60);
        } else if (acceType === 'headband') {
            ctx.fillStyle = 'red';
            ctx.fillRect(cx - 120, cy - 100, 240, 20);
        }

    }
}

class QuoteGenerator {
    constructor(data) {
        this.canvas = document.getElementById('quote-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gradients = data.gradients;
        this.quotes = data.quotes;
        this.currentQuote = this.quotes[0];
        this.currentBg = this.gradients[0];

        this.init();
    }

    init() {
        const container = document.getElementById('quote-bg-options');

        this.gradients.forEach((g, idx) => {
            const btn = document.createElement('div');
            btn.className = 'color-option';
            btn.style.background = g;
            btn.onclick = () => {
                this.currentBg = g;
                this.draw();
            };
            container.appendChild(btn);
        });

        document.getElementById('quote-text').addEventListener('input', (e) => {
            this.currentQuote.text = e.target.value;
            this.draw();
        });
        document.getElementById('quote-author').addEventListener('input', (e) => {
            this.currentQuote.author = e.target.value;
            this.draw();
        });

        document.getElementById('quote-random-text').addEventListener('click', () => {
            const random = this.quotes[Math.floor(Math.random() * this.quotes.length)];
            this.currentQuote = { ...random };
            document.getElementById('quote-text').value = this.currentQuote.text;
            document.getElementById('quote-author').value = this.currentQuote.author;
            this.draw();
        });

        document.getElementById('quote-download').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'quote.png';
            link.href = this.canvas.toDataURL();
            link.click();
            App.history.add({ type: 'Quote', date: new Date().toLocaleTimeString() });
        });

        this.draw();
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        const grd = ctx.createLinearGradient(0, 0, w, h);

        const colors = this.currentBg.match(/#[a-fA-F0-9]{6}/g) || ['#000000', '#ffffff'];
        grd.addColorStop(0, colors[0]);
        grd.addColorStop(1, colors[1] || colors[0]);

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;

        ctx.font = 'italic bold 32px "Space Grotesk", "Playfair Display", serif';
        this.wrapText(ctx, `"${this.currentQuote.text}"`, w / 2, h / 2 - 20, w - 100, 42);

        ctx.font = '20px "Outfit", sans-serif';
        ctx.fillText(`- ${this.currentQuote.author}`, w / 2, h / 2 + 80);

        ctx.shadowBlur = 0;
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        let startY = y - ((lines.length - 1) * lineHeight) / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, startY + (i * lineHeight));
        }
    }
}

class HistoryManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('makerHistory')) || [];
        this.render();
    }

    add(item) {
        this.items.unshift(item);
        if (this.items.length > 5) this.items.pop();
        localStorage.setItem('makerHistory', JSON.stringify(this.items));
        this.render();
    }

    render() {
        const container = document.getElementById('mini-history-list');
        if (!container) return;

        container.innerHTML = '';
        if (this.items.length === 0) {
            container.innerHTML = '<span class="empty-state">No projects</span>';
            return;
        }

        this.items.forEach(item => {
            const div = document.createElement('div');
            div.style.marginBottom = '0.5rem';
            div.innerHTML = `<i class="fa-solid fa-check"></i> <b>${item.type}</b> <span style="font-size:0.8em; opacity:0.6">${item.date}</span>`;
            container.appendChild(div);
        });
    }
}

const App = {
    router: null,
    memeGen: null,
    avatarGen: null,
    quoteGen: null,
    history: null,
    localization: null,

    init() {
        try {
            const data = APP_DATA;

            this.router = new Router();
            this.history = new HistoryManager();
            this.localization = new LocalizationManager(data);

            try { this.memeGen = new MemeGenerator(data); } catch (e) { console.error("Meme Gen Error", e); }
            try { this.avatarGen = new AvatarGenerator(data); } catch (e) { console.error("Avatar Gen Error", e); }
            try { this.quoteGen = new QuoteGenerator(data); } catch (e) { console.error("Quote Gen Error", e); }

        } catch (err) {
            console.error("Critical App Init Error", err);
        }
    }

};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
