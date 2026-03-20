// A simple real-time scanner that runs on every website you visit
console.log("PayGuard AI: Monitoring active on this page.");

const pageText = document.body.innerText.toLowerCase();
const scamKeywords = ['urgent action required', 'verify your account', 'claim your prize', 'free gift'];

const isSuspicious = scamKeywords.some(keyword => pageText.includes(keyword));

if (isSuspicious) {
    alert("🚨 PAYGUARD AI WARNING 🚨\n\nSuspicious phishing keywords detected on this page. Do not enter your banking details or OTP here!");
    document.body.style.border = "5px solid red";
}