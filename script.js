let productSwiper, messageSwiper;

// --- LINE LIFF INITIALIZATION ---
async function initializeLiff() {
    try {
        // เริ่มต้นการใช้งาน LIFF ด้วย ID ของคุณ
        await liff.init({ liffId: "2008756827-zANFfOMQ" });

        if (liff.isLoggedIn()) {
            console.log("LIFF Logged In");
            // หากล็อกอินแล้ว สามารถดึงชื่อผู้ใช้มาใส่ในช่อง 'ผู้ส่ง' อัตโนมัติได้ (Optional)
            liff.getProfile().then(profile => {
                const senderInput = document.getElementById('sender-name');
                if (senderInput && !senderInput.value) {
                    senderInput.value = profile.displayName;
                }
            });
        } else {
            console.log("LIFF Not Logged In - Waiting for user action");
            // คุณสามารถเลือกให้ liff.login() ทันทีที่เข้าเว็บเลยก็ได้ โดยนำคอมเมนต์ออก:
            // liff.login();
        }

        // ระบบจัดการการเปิดของขวัญ (เมื่อเพื่อนกด Link มา)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('openGift') === 'true') {
            const giftImg = urlParams.get('img');
            const giftMsg = urlParams.get('msg');
            
            // เรียกฟังก์ชันแสดงหน้าเปิดของขวัญ (ต้องมีฟังก์ชัน showShakePage รองรับ)
            if (typeof showShakePage === "function") {
                showShakePage(giftImg, giftMsg);
            }
        }

    } catch (error) {
        console.error("LIFF Initialization failed", error);
    }
}

// เรียกใช้งานทันทีเมื่อโหลดหน้าเว็บ
initializeLiff();
// --------------------------------


// ตั้งค่า Swiper ตั้งแต่โหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    initSwipers();
});

function initSwipers() {
    // 1. Swiper สินค้า
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
                // ดึง Slide ที่ Active จริงๆ (รองรับ Loop)
                const activeSlide = this.slides[this.activeIndex];
                const name = activeSlide.getAttribute('data-name');
                const img = activeSlide.querySelector('img').src;
                
                document.getElementById('selected-product-name').innerText = name;
                window.selectedProductImg = img;
                window.selectedProductName = name;
            }
        }
    });

    // 2. Swiper ข้อความ
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

// เพิ่มฟังก์ชันนี้ลงไป (หรือตรวจสอบว่า goToSection เดิมรองรับการเรียกใช้ซ้ำได้)

function goToSection(num) {
    // ซ่อนทุก Section
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    
    // แสดง Section ที่ต้องการ
    const targetSection = document.getElementById(`section-${num}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // บังคับให้ Swiper คำนวณตำแหน่งใหม่ทุกครั้งที่กลับมาหน้า 3
    if (num === 3) {
        setTimeout(() => {
            if (productSwiper) productSwiper.update();
            if (messageSwiper) messageSwiper.update();
            
            // เล่นเพลงต่อ (ถ้าเพลงหยุด)
            const music = document.getElementById('bg-music');
            if (music && music.paused) {
                music.play().catch(e => console.log("Music play blocked"));
            }
        }, 150); // เพิ่มเวลาเล็กน้อยเพื่อให้หน้าจอ Render เสร็จก่อน Update
    }
}

// ฟังก์ชันสรุปข้อมูล
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
    // 1. ตรวจสอบว่าเปิดผ่าน LIFF หรือไม่
    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }

    // 2. ดึงค่าที่ User เลือกไว้
    const receiver = document.getElementById('receiver-name').value;
    const sender = document.getElementById('sender-name').value;
    
    // สร้าง Link สำหรับผู้รับ (ใส่ข้อมูลไปกับ URL เพื่อให้หน้าเปิดของขวัญแสดงผลถูก)
    const shareUrl = `https://liff.line.me/2008756827-zANFfOMQ?openGift=true&img=${encodeURIComponent(window.selectedProductImg)}&msg=${encodeURIComponent(window.selectedMessage)}`;

    // 3. ตรวจสอบ Permission การแชร์
    if (liff.isApiAvailable('shareTargetPicker')) {
        try {
            const result = await liff.shareTargetPicker([
                {
                    "type": "flex",
                    "altText": `คุณได้รับของขวัญจากคุณ ${sender}`,
                    "contents": {
                        "type": "bubble",
                        "hero": {
                            "type": "image",
                            "url": window.selectedProductImg,
                            "size": "full",
                            "aspectRatio": "20:13",
                            "aspectMode": "cover"
                        },
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                { "type": "text", "text": "Surprise! 🎁", "weight": "bold", "color": "#b89a5b", "size": "sm" },
                                { "type": "text", "text": `ถึง: ${receiver}`, "weight": "bold", "size": "xl", "margin": "md" },
                                { "type": "text", "text": window.selectedMessage, "wrap": true, "color": "#666666", "margin": "md" },
                                { "type": "separator", "margin": "lg" },
                                { "type": "text", "text": `จาก: ${sender}`, "size": "xs", "color": "#999999", "margin": "md" }
                            ]
                        },
                        "footer": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "button",
                                    "action": {
                                        "type": "uri",
                                        "label": "เปิดดูของขวัญ",
                                        "uri": shareUrl
                                    },
                                    "style": "primary",
                                    "color": "#b89a5b"
                                }
                            ]
                        }
                    }
                }
            ]);

            if (result) {
                alert("ส่งของขวัญเรียบร้อยแล้ว!");
                liff.closeWindow(); // ปิดหน้าต่าง LIFF ทันทีหลังส่งเสร็จ
            } else {
                console.log("User cancelled the picker");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่");
        }
    } else {
        alert("ฟีเจอร์นี้ไม่รองรับบนเบราว์เซอร์ภายนอก กรุณาเปิดใน LINE");
    }
}


