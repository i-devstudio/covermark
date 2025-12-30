// ==========================================
// 1. GLOBAL VARIABLES & STATE
// ==========================================
let productSwiper, messageSwiper;

// ==========================================
// 2. INITIALIZATION (ระบบเริ่มต้น)
// ==========================================

// เรียกใช้งานเมื่อโหลดหน้าเว็บเสร็จสมบูรณ์
window.onload = function() {
    initializeLiff();
};

// ตั้งค่า Swiper หลังจากโครงสร้าง DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    initSwipers();
});

async function initializeLiff() {
    try {
        await liff.init({ liffId: "2008756827-zANFfOMQ" });
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get('openGift') === 'true') {
            // [กรณีผู้รับ] เริ่มกระบวนการเปิดของขวัญ
            const img = urlParams.get('img');
            const msg = urlParams.get('msg');
            const sender = urlParams.get('from') || "เพื่อนของคุณ";
            const receiver = urlParams.get('receiver') || "คุณ";
            
            startShakeProcess(img, msg, sender, receiver);
        } else {
            // [กรณีผู้ส่ง] แสดงหน้าแรกเพื่อเริ่มสร้างของขวัญ
            const sec1 = document.getElementById('section-1');
            if(sec1) sec1.style.display = 'block';
            
            // ดึงชื่อโปรไฟล์ LINE มาใส่ในช่องผู้ส่ง (ถ้า Logged In)
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    const senderInput = document.getElementById('sender-name');
                    if (senderInput && !senderInput.value) {
                        senderInput.value = profile.displayName;
                    }
                });
            }
        }
    } catch (error) {
        console.error("LIFF Init Error", error);
    }
}

function initSwipers() {
    // Swiper สินค้า
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

    // Swiper ข้อความ
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
// 3. SENDER WORKFLOW (ฟังก์ชันสำหรับผู้ส่ง)
// ==========================================

function goToSection(num) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    
    const targetSection = document.getElementById(`section-${num}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // บังคับ Update Swiper เมื่อกลับมาที่หน้าเลือกของขวัญ (Section 3)
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
    
    // ประกอบ URL พร้อมพารามิเตอร์ข้อมูล
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

// ==========================================
// 4. RECEIVER WORKFLOW (ฟังก์ชันสำหรับผู้รับ)
// ==========================================

function startShakeProcess(img, msg, sender, receiver) {
    console.log("Start Shake Process Triggered");

    // 1. ซ่อนทุก Section ทันที
    document.querySelectorAll('section').forEach(s => {
        s.style.setProperty("display", "none", "important");
    });

    // 2. แสดงหน้าเปิดของขวัญ (Section 5)
    setTimeout(() => {
        const sec5 = document.getElementById('section-5');
        if (sec5) {
            sec5.style.setProperty("display", "block", "important");
            
            // แสดงข้อมูลในหน้าจอ
            if(document.getElementById('view-receiver')) document.getElementById('view-receiver').innerText = `ถึง คุณ${receiver}`;
            if(document.getElementById('view-sender')) document.getElementById('view-sender').innerText = sender;
            if(document.getElementById('final-receiver')) document.getElementById('final-receiver').innerText = `คุณ${receiver}`;
            if(document.getElementById('final-message')) document.getElementById('final-message').innerText = `"${msg}"`;
            if(document.getElementById('result-product-img')) document.getElementById('result-product-img').src = img;
        }
    }, 100);

    // 3. เริ่มระบบตรวจจับการเขย่า
    if (typeof initShakeDetection === "function") {
        initShakeDetection();
    }
}

function revealGift() {
    // สลับหน้าจอภายใน Section 5 จากหน้าเขย่าเป็นหน้าผลลัพธ์
    document.getElementById('shake-view').style.display = 'none';
    document.getElementById('gift-result-view').style.display = 'block';
    
    // เอฟเฟกต์พลุเฉลิมฉลอง
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}