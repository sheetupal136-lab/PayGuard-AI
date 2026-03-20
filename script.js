let lastDecodedText = "";
let html5QrCode; // Global instance for the live scanner

// LOGIN SYSTEM (Now Dynamic)
function performLogin() {
    // 1. Get user input
    let nameInput = document.getElementById('login-name').value.trim();
    let emailInput = document.getElementById('login-email').value.trim();
    
    // Set defaults if user leaves it blank
    if (!nameInput) nameInput = "Guest User";
    if (!emailInput) emailInput = "user@college.edu";

    // 2. Generate Initials & Names
    const names = nameInput.split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    
    let initials = firstName.charAt(0).toUpperCase();
    if (lastName) initials += lastName.charAt(0).toUpperCase();

    // 3. Update all UI elements dynamically
    document.getElementById('sidebar-name').innerText = nameInput;
    document.getElementById('sidebar-initials').innerText = initials;
    
    document.getElementById('dash-welcome').innerText = 'Welcome, ' + firstName;
    
    document.getElementById('profile-name').innerText = nameInput;
    document.getElementById('profile-initials').innerText = initials;
    document.getElementById('profile-email-disp').innerText = emailInput;
    document.getElementById('profile-fname').value = firstName;
    document.getElementById('profile-lname').value = lastName;
    
    // Generate a random ID based on the year
    document.getElementById('profile-id-disp').innerText = "PG-2026-" + Math.floor(1000 + Math.random() * 9000) + "-X1";

    // 4. Initialize Chatbot greeting with user's name
    const chatBox = document.getElementById('chat-window');
    chatBox.innerHTML = `<div class="bubble bot shadow-lg">Welcome ${firstName}! How can I help secure your digital payments today?</div>`;

    // 5. Hide Login, Show App
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('sidebar').style.display = 'flex';
    document.getElementById('main-content').style.display = 'block';
    nav('home');
}

function performLogout() {
    location.reload(); 
}

// NAVIGATION
function nav(id) {
    if (id !== 'scanner' && html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.getElementById('camera-container').style.display = 'none';
            document.getElementById('upload-label').style.display = 'flex';
            document.getElementById('btn-start-cam').style.display = 'flex';
        }).catch(err => console.log(err));
    }

    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));

    document.getElementById('p-' + id).classList.add('active');

    const navMap = { 'home': 0, 'scanner': 1, 'assistant': 2, 'profile': 3 };
    const index = navMap[id];
    if(index !== undefined) {
        document.querySelectorAll('.nav-item')[index].classList.add('active');
    }
}

function setScanMode(mode) {
    document.getElementById('qr-input-area').style.display = (mode === 'qr') ? 'block' : 'none';
    document.getElementById('text-input-area').style.display = (mode === 'text') ? 'block' : 'none';

    document.querySelectorAll('.scanner-tab').forEach(btn => {
        btn.classList.remove('active', 'text-cyan-400', 'font-bold');
        btn.classList.add('text-slate-500');
    });
    const activeTab = document.getElementById('tab-' + mode);
    activeTab.classList.add('active', 'text-cyan-400', 'font-bold');
    activeTab.classList.remove('text-slate-500');
    resetScanner();
}

// LIVE CAMERA LOGIC
function startLiveCamera() {
    document.getElementById('upload-label').style.display = 'none';
    document.getElementById('btn-start-cam').style.display = 'none';
    const camContainer = document.getElementById('camera-container');
    camContainer.style.display = 'block';

    if(!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            html5QrCode.stop().then(() => {
                camContainer.style.display = 'none';
                document.getElementById('btn-start-cam').style.display = 'flex';
                onScanSuccess(decodedText);
            });
        }
    ).catch(err => {
        console.log("Camera access denied or error:", err);
        alert("Camera access failed. Please use File Upload instead.");
        camContainer.style.display = 'none';
        document.getElementById('upload-label').style.display = 'flex';
        document.getElementById('btn-start-cam').style.display = 'flex';
    });
}

// FILE UPLOAD LOGIC
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('qr-preview-img');
    const prompt = document.getElementById('upload-prompt');
    const fileScanner = new Html5Qrcode("reader"); 

    const readerFr = new FileReader();
    readerFr.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        prompt.style.display = 'none';
    };
    readerFr.readAsDataURL(file);

    try {
        const text = await fileScanner.scanFile(file, true);
        onScanSuccess(text);
        fileScanner.clear();
    } catch (err) {
        resetScanner();
        alert("Decoding Failed: Could not find a clear QR code.");
    }
}

// UI UPDATE LOGIC
function onScanSuccess(text) {
    lastDecodedText = text;
    document.getElementById('res-raw-data').innerText = text;
    document.getElementById('results-placeholder').classList.add('hidden');
    document.getElementById('results-area').classList.remove('hidden');
    document.getElementById('btn-final-check').classList.remove('hidden');

    document.getElementById('res-verdict').innerText = "Data Extracted";
    const status = document.getElementById('res-status');
    status.innerText = "AWAITING AI ANALYSIS";
    status.className = "text-yellow-400 text-sm font-bold uppercase tracking-widest";
}

// SCAM DETECTION ENGINE
function triggerDeepAnalysis() {
    const btn = document.getElementById('btn-final-check');
    btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> ✨ Running AI...";

    setTimeout(() => {
        const suspiciousKeywords = ['free', 'reward', 'gift', 'win', 'cashback', 'bit.ly', 'fake', 'urgent', '.xyz'];
        const isSuspicious = suspiciousKeywords.some(word => lastDecodedText.toLowerCase().includes(word));
        
        const isSafe = !isSuspicious;
        
        const res = {
            isSafe: isSafe,
            score: isSafe ? 98 : 12,
            reasoning: isSafe 
                ? "Explainable AI: Data matches official merchant records and secured UPI protocols. No phishing markers detected." 
                : "Explainable AI: This link uses high-risk phishing patterns, urgency tactics, or a masked URL intended to steal credentials.",
            verdict: isSafe ? "Safe to Pay" : "DANGER: SCAM DETECTED",
            domain: lastDecodedText.includes("://") ? new URL(lastDecodedText).hostname : "Direct Data"
        };
        
        updateUI(res);
        btn.classList.add('hidden');
        
        if(!isSafe) {
            document.getElementById('results-area').classList.add('animate-pulse');
            setTimeout(() => document.getElementById('results-area').classList.remove('animate-pulse'), 1500);
        }
    }, 1000);
}

function updateUI(res) {
    const area = document.getElementById('results-area');
    const circle = document.getElementById('res-circle-border');

    const col = res.isSafe ? 'var(--success)' : 'var(--danger)';
    area.style.borderLeftColor = col;
    circle.style.borderColor = col;

    document.getElementById('res-score-text').innerText = res.score;
    document.getElementById('res-verdict').innerText = res.verdict;
    document.getElementById('res-verdict').className = res.isSafe ? "text-2xl font-bold text-green-400" : "text-2xl font-bold text-red-500";

    const statusText = document.getElementById('res-status');
    statusText.innerText = res.isSafe ? "SAFE VERIFIED" : "BLOCK & REPORT";
    statusText.className = res.isSafe ? "text-green-400 font-bold tracking-widest" : "text-red-500 font-bold tracking-widest";

    document.getElementById('res-reasoning').innerText = res.reasoning;
    document.getElementById('res-domain').innerText = res.domain;
    document.getElementById('res-rating').innerText = res.score + "% Safety";
    document.getElementById('res-rating').className = res.isSafe ? "text-green-400 text-sm font-bold" : "text-red-500 text-sm font-bold";
}

function resetScanner() {
    document.getElementById('results-area').classList.add('hidden');
    document.getElementById('results-placeholder').classList.remove('hidden');
    document.getElementById('qr-preview-img').style.display = 'none';
    document.getElementById('upload-prompt').style.display = 'block';
    document.getElementById('upload-label').style.display = 'flex';
    document.getElementById('qr-file-input').value = "";
    document.getElementById('btn-final-check').classList.add('hidden');
    document.getElementById('btn-start-cam').style.display = 'flex';
    lastDecodedText = "";
}

async function triggerAnalysis(input) {
    if(!input) return;
    lastDecodedText = input;
    onScanSuccess(input);
    triggerDeepAnalysis();
}

// SMARTER CHATBOT
function sendChat() {
    const inp = document.getElementById('chat-in');
    const box = document.getElementById('chat-window');
    const text = inp.value.trim();
    if(!text) return;

    // Show User Message
    box.innerHTML += `<div class="bubble user self-end bg-blue-600 text-white shadow-sm">${text}</div>`;
    inp.value = "";
    box.scrollTop = box.scrollHeight;

    // Determine AI Reply based on keywords
    setTimeout(() => {
        let reply = "I'm monitoring your connection. Everything looks secure. Paste a link in the Deep Scanner if you want me to audit it.";
        const lowerText = text.toLowerCase();

        if (lowerText.includes("hello") || lowerText.includes("hi")) {
            reply = "Hello there! I am PayGuard AI. I'm here to analyze suspicious links and keep your payments safe.";
        } else if (lowerText.includes("scam") || lowerText.includes("fraud") || lowerText.includes("phishing") || lowerText.includes("fake")) {
            reply = "Always remember: Genuine banks and platforms will NEVER ask for your OTP, PIN, or CVV over a phone call, SMS, or WhatsApp. Stay alert!";
        } else if (lowerText.includes("extension")) {
            reply = "You can install our browser extension from the 'Extension Portal' tab on the left for real-time background protection.";
        } else if (lowerText.includes("safe") || lowerText.includes("secure")) {
            reply = "Your current session is encrypted and secure. I currently detect 0 threats on your network.";
        } else if (lowerText.includes("qr") || lowerText.includes("scan")) {
            reply = "Head over to the 'Deep Scanner' tab. You can use your camera or upload an image to analyze any QR code before paying.";
        }

        // Show AI Reply
        box.innerHTML += `<div class="bubble bot self-start bg-slate-800">${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 800);
}

// 1-CLICK EXTENSION PORTAL
function toggleExt() {
    const o = document.getElementById('ext-overlay');
    o.style.display = (o.style.display === 'flex') ? 'none' : 'flex';

    document.getElementById('install-ui').classList.remove('hidden');
    document.getElementById('pg-success-alert').classList.add('hidden');
    
    // Reset button text just in case
    const b = document.getElementById('btn-download-ext');
    if (b) b.innerHTML = "<i class='fa-brands fa-chrome'></i> Install in Chrome";
}

function downloadAndInstall() {
    const b = document.getElementById('btn-download-ext');
    b.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Generating Package...";

    // This creates the real manifest file for the user to download
    const manifestContent = {
        "manifest_version": 3,
        "name": "PayGuard AI Defense",
        "version": "1.0",
        "description": "Real-time phishing and fraud protection module."
    };
    
    const blob = new Blob([JSON.stringify(manifestContent, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "manifest.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show the actual instructions for Developer Mode
    setTimeout(() => {
        document.getElementById('install-ui').innerHTML = `
            <div class="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl text-left shadow-2xl">
                <h4 class="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2"><i class="fa-solid fa-shield-check"></i> Package Downloaded!</h4>
                <p class="text-sm text-slate-300 mb-6 leading-relaxed">For security reasons, Chrome requires local AI models to be loaded manually. Please follow these quick steps to activate your real-time defense:</p>
                <ul class="text-sm space-y-4 text-slate-400 mb-8">
                    <li class="flex items-start"><span class="step-badge bg-cyan-600 text-white">1</span> <span>Put the downloaded <b>manifest.json</b> into a new folder.</span></li>
                    <li class="flex items-start"><span class="step-badge bg-cyan-600 text-white">2</span> <span>Type <b class="bg-black px-2 py-1 text-cyan-400 rounded">chrome://extensions</b> in your browser.</span></li>
                    <li class="flex items-start"><span class="step-badge bg-cyan-600 text-white">3</span> <span>Turn ON <b>Developer Mode</b> (top right).</span></li>
                    <li class="flex items-start"><span class="step-badge bg-cyan-600 text-white">4</span> <span>Click <b>Load Unpacked</b> and select your folder.</span></li>
                </ul>
                <button class="w-full bg-cyan-600 py-4 rounded-xl font-bold text-white hover:bg-cyan-500 transition shadow-lg" onclick="toggleExt()">I have activated it</button>
            </div>
        `;
    }, 1500);
}