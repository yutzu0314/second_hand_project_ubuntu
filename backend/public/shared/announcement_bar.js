async function loadAnnouncementBar() {
    const bar = document.getElementById("announcementBar");
    const textSpan = document.getElementById("announcementText");
    if (!bar || !textSpan) return;

    try {
        const res = await fetch("/api/announcements/public?limit=3");
        if (!res.ok) throw new Error("fetch failed");
        const list = await res.json();

        if (!list.length) {
            bar.style.display = "none";
            return;
        }

        // 整理要顯示的文字（多筆就用 ｜ 串起來）
        const text = list
            .map(a => `[公告] ${a.title}`)
            .join(" ｜ ");

        textSpan.textContent = text;
        bar.style.display = "block";

        // 要跑馬燈就打開這行
        textSpan.classList.add("announcement-scroll");

        // 點公告列 → 跳到公告頁
        bar.onclick = () => {
            window.location.href = "/buyer/notice.html";
        };
    } catch (err) {
        console.error("loadAnnouncementBar error", err);
        bar.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", loadAnnouncementBar);
