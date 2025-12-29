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
    // ตรวจสอบการ Login ก่อนเสมอ
    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }

    const receiver = document.getElementById('receiver-name').value;
    const sender = document.getElementById('sender-name').value;

    if (!receiver || !sender) {
        alert("กรุณากรอกชื่อผู้รับและผู้ส่งให้ครบถ้วน");
        return;
    }

    // --- แก้ไขจุดนี้: ประกาศตัวแปรที่ขาดไป ---
    const bgImage = "https://i.pinimg.com/1200x/34/fa/9f/34fa9f65309de40a66da3808161d7310.jpg";
    const currentImg = window.selectedProductImg || document.querySelector('.product-swiper .swiper-slide-active img').src;
    const currentMsg = window.selectedMessage || document.querySelector('.message-swiper .swiper-slide-active').innerText.trim();

    // สร้างลิงก์สำหรับการเปิดของขวัญ
    const shareUrl = `https://liff.line.me/2008756827-zANFfOMQ?openGift=true&img=${encodeURIComponent(currentImg)}&msg=${encodeURIComponent(currentMsg)}&from=${encodeURIComponent(sender)}`;

    if (liff.isApiAvailable('shareTargetPicker')) {
        try {
            // เรียกใช้ Share Target Picker พร้อมโครงสร้างที่ถูกต้อง
            const result = await liff.shareTargetPicker([
                {
                    "type": "flex",
                    "altText": `คุณได้รับของขวัญจาก ${sender}`,
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
                                            "url": bgImage, // ใช้ตัวแปรที่ประกาศไว้ข้างต้น
                                            "size": "full",
                                            "aspectRatio": "3:4",
                                            "aspectMode": "cover"
                                        },
                                        {
                                            "type": "box",
                                            "layout": "vertical",
                                            "contents": [
                                                { "type": "text", "text": "COVERMARK", "weight": "bold", "color": "#ffffff", "align": "center" }
                                            ],
                                            "position": "absolute",
                                            "offsetTop": "20px",
                                            "offsetStart": "0px",
                                            "offsetEnd": "0px"
                                        },
                                        {
                                            "type": "box",
                                            "layout": "vertical",
                                            "contents": [
                                                { "type": "text", "text": `To: ${receiver}`, "weight": "bold", "color": "#ffffff", "align": "center", "size": "lg" },
                                                { "type": "text", "text": currentMsg, "color": "#ffffff", "align": "center", "wrap": true }
                                            ],
                                            "position": "absolute",
                                            "offsetStart": "0px",
                                            "offsetEnd": "0px",
                                            "offsetBottom": "80px"
                                        },
                                        {
                                            "type": "box",
                                            "layout": "vertical",
                                            "contents": [
                                                {
                                                    "type": "button",
                                                    "action": {
                                                        "type": "uri",
                                                        "label": "เปิดกล่องของขวัญ",
                                                        "uri": shareUrl
                                                    },
                                                    "style": "primary",
                                                    "height": "sm",
                                                    "color": "#e63946",
                                                    "width": "60%"
                                                }
                                            ],
                                            "position": "absolute",
                                            "offsetStart": "0px",
                                            "offsetEnd": "0px",
                                            "offsetBottom": "20px",
                                            "alignItems": "center"
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
            console.error("Error Detail:", error);
            alert("ส่งไม่สำเร็จเนื่องจาก: " + error.message);
        }
    } else {
        alert("กรุณาเปิดลิงก์นี้ในแอป LINE เพื่อส่งของขวัญ");
    }
}


