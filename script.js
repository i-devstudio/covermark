// ==========================================
// 1. GLOBAL VARIABLES & STATE
// ==========================================
let productSwiper, messageSwiper;

// ==========================================
// 2. INITIALIZATION (ระบบเริ่มต้น)
// ==========================================

// เรียกใช้งานเมื่อโหลดหน้าเว็บเสร็จสมบูรณ์ (เหลือจุดเดียว)
window.onload = function() {
    initializeLiff();
};

// ตั้งค่า Swiper หลังจากโครงสร้าง DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    initSwipers();
});

async function initializeLiff() {
    const urlParams = new URLSearchParams(window.location.search);
    const isOpenGift = urlParams.get('openGift') === 'true';

    // 1. ถ้าเป็นผู้รับ (เปิดของขวัญ) ให้ซ่อนหน้าเริ่มต้นทันทีตั้งแต่วินาทีแรกเพื่อกันหน้าขาว/หน้าแรกโผล่
    if (isOpenGift) {
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    }

    try {
        await liff.init({ liffId: "2008756827-zANFfOMQ" });
    } catch (error) {
        console.error("LIFF Init Error: Failed to fetch แต่จะทำงานต่อ", error);
    }

    // 2. จัดการการแยกเส้นทางการแสดงผล (ผู้ส่ง vs ผู้รับ)
    if (isOpenGift) {
        const img = urlParams.get('img');
        const msg = urlParams.get('msg');
        const sender = urlParams.get('from') || "เพื่อนของคุณ";
        const receiver = urlParams.get('receiver') || "คุณ";
        
        startShakeProcess(img, msg, sender, receiver);
    } else {
        const sec1 = document.getElementById('section-1');
        if(sec1) sec1.style.display = 'block';
    }
}

// ==========================================
// 3. RECEIVER WORKFLOW (ฟังก์ชันสำหรับผู้รับ - หน้า 5)
// ==========================================

function startShakeProcess(img, msg, sender, receiver) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const sec5 = document.getElementById('section-5');
    
    if (sec5) {
        sec5.style.setProperty("display", "block", "important");
        
        document.getElementById('view-receiver').innerText = `ถึง คุณ${receiver}`;
        document.getElementById('view-sender').innerText = sender;
        document.getElementById('final-receiver').innerText = `คุณ${receiver}`;
        document.getElementById('final-message').innerText = `"${msg}"`;
        document.getElementById('result-product-img').src = img;
        
        if (typeof initShakeDetection === "function") {
            initShakeDetection();
        }
    }
}

function revealGift() {
    document.getElementById('shake-view').style.display = 'none';
    document.getElementById('gift-result-view').style.display = 'block';
    
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}

// ==========================================
// 4. SWIPER CONFIGURATION
// ==========================================

function initSwipers() {
    productSwiper = new Swiper('.product-swiper', {
        loop: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 30,
        grabCursor: true,
        observer: true,
        observeParents: true,
        on: {
            slideChange: function () {
                const activeSlide = this.slides[this.activeIndex];
                const name = activeSlide.getAttribute('data-name');
                const img = activeSlide.querySelector('img').src;
                
                document.getElementById('selected-product-name').innerText = name;
                window.selectedProductImg = img;
                window.selectedProductName = name;
            }
        }
    });

    messageSwiper = new Swiper('.message-swiper', {
        loop: true,
        centeredSlides: true,
        slidesPerView: 1,
        grabCursor: true,
        observer: true,
        observeParents: true,
        on: {
            slideChange: function () {
                const activeSlide = this.slides[this.activeIndex];
                window.selectedMessage = activeSlide.innerText.trim();
            }
        }
    });
}

// ==========================================
// 5. SENDER WORKFLOW (ฟังก์ชันสำหรับผู้ส่ง - หน้า 1-4)
// ==========================================

function goToSection(num) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    
    const targetSection = document.getElementById(`section-${num}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (num === 3) {
        setTimeout(() => {
            if (productSwiper) productSwiper.update();
            if (messageSwiper) messageSwiper.update();
            
            const music = document.getElementById('bg-music');
            if (music && music.paused) {
                music.play().catch(e => console.log("Music play blocked"));
            }
        }, 150);
    }
}

function summarizeData() {
    const receiver = document.getElementById('receiver-name').value;
    const sender = document.getElementById('sender-name').value;

    if (!receiver || !sender) {
        alert("กรุณากรอกชื่อผู้รับและผู้ส่ง");
        return;
    }

    const summaryHtml = `
        <div style="border:1px solid #ddd; padding:20px; border-radius:15px;">
            <img src="${window.selectedProductImg}" width="150">
            <h4>${window.selectedProductName}</h4>
            <p><strong>ถึง:</strong> ${receiver}</p>
            <p><strong>ข้อความ:</strong> ${window.selectedMessage}</p>
            <p><strong>จาก:</strong> ${sender}</p>
        </div>
    `;
    document.getElementById('summary-display').innerHTML = summaryHtml;
    goToSection(4);
}

async function sendGift() {
    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }

    const receiver = document.getElementById('receiver-name').value;
    const sender = document.getElementById('sender-name').value;
    
    const shareUrl = `https://liff.line.me/2008756827-zANFfOMQ?openGift=true&img=${encodeURIComponent(window.selectedProductImg)}&msg=${encodeURIComponent(window.selectedMessage)}&from=${encodeURIComponent(sender)}&receiver=${encodeURIComponent(receiver)}`;

    if (liff.isApiAvailable('shareTargetPicker')) {
        try {
            const result = await liff.shareTargetPicker([
                {
                    "type": "flex",
                    "altText": `คุณได้รับของขวัญจากคุณ ${sender}`,
                    "contents": {
                        "type": "bubble",
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "box",
                                    "layout": "vertical",
                                    "contents": [
                                        {
                                            "type": "image",
                                            "url": "https://img5.pic.in.th/file/secure-sv1/COVERMARK.jpg",
                                            "size": "full",
                                            "aspectRatio": "3:4",
                                            "aspectMode": "cover"
                                        },
                                        {
                                            "type": "box",
                                            "layout": "vertical",
                                            "contents": [
                                                { "type": "text", "text": `To: ${receiver}`, "weight": "bold", "color": "#ffffff", "align": "center" },
                                                { "type": "text", "text": window.selectedMessage, "weight": "regular", "color": "#ffffff", "align": "center" }
                                            ],
                                            "height": "40px",
                                            "justifyContent": "center",
                                            "alignItems": "center",
                                            "position": "absolute",
                                            "offsetStart": "50px", "offsetEnd": "50px", "offsetBottom": "80px"
                                        },
                                        {
                                            "type": "button",
                                            "action": { "type": "uri", "label": "เปิดกล่องของขวัญ", "uri": shareUrl },
                                            "style": "primary", "height": "sm", "position": "absolute",
                                            "offsetStart": "50px", "offsetEnd": "50px", "offsetBottom": "20px"
                                        }
                                    ],
                                    "position": "relative"
                                }
                            ],
                            "paddingAll": "0px"
                        }
                    }
                }
            ]);

            if (result) {
                alert("ส่งของขวัญเรียบร้อยแล้ว!");
                liff.closeWindow();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่");
        }
    } else {
        alert("ฟีเจอร์นี้ไม่รองรับบนเบราว์เซอร์ภายนอก กรุณาเปิดใน LINE");
    }
}