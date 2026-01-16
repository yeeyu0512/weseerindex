/* script.js - 賽爾號啟動器邏輯核心 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tabs 頁籤切換邏輯
  const navItems = document.querySelectorAll('.navitem');
  const sections = document.querySelectorAll('.section');

  function activate(id) {
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    navItems.forEach(n => n.classList.toggle('active', n.dataset.section === id));
    if (id) history.replaceState(null, null, '#' + id);
  }

  navItems.forEach(n => n.addEventListener('click', () => activate(n.dataset.section)));

  if (location.hash) {
    const id = location.hash.slice(1);
    if (document.getElementById(id)) activate(id);
  }

  // 2. 免責聲明 Checkbox 邏輯 (按鈕解鎖模式)
  const agreeBox = document.getElementById('agreeDisclaimer');
  const gdriveBtn = document.getElementById('gdriveDownload');

  if (agreeBox && gdriveBtn) {
    agreeBox.addEventListener('change', () => {
      // 勾選時移除 .disabled，取消勾選時加回去
      if (agreeBox.checked) {
        gdriveBtn.classList.remove('disabled');
      } else {
        gdriveBtn.classList.add('disabled');
      }
    });
  }

  // 3. JSON 日誌載入邏輯 (時間軸風格)
  loadChangelog();

  // 4. Hero Carousel 輪播邏輯
  initHeroCarousel();
});


/* =========== 功能函數定義 =========== */

// 載入開發日誌 JSON
async function loadChangelog() {
  const container = document.getElementById('changelog-container');
  if (!container) return;

  try {
    const response = await fetch('changelog.json');
    if (!response.ok) throw new Error('無法讀取日誌檔案');
    const data = await response.json();

    let html = '';
    
    // 遍歷每一個版本
    data.forEach((item, index) => {
      // 判斷是否為第一個 (最新版本)
      const isFirst = index === 0;
      // 第一個版本預設加上 'active' class (展開)，其他不加
      const activeClass = isFirst ? 'active' : ''; 
      
      const listItems = item.changes.map(change => `
        <li>
          <span class="tag ${change.tagType}">${change.tagLabel}</span>
          <span>${change.content}</span>
        </li>
      `).join('');

      html += `
        <div class="changelog-item ${activeClass}">
          <div class="changelog-dot"></div>
          
          <div class="changelog-header">
            <div class="version-info">
              <span class="version-num">v${item.version}</span>
              <span class="version-date">${item.date}</span>
            </div>
            <span class="toggle-icon">▼</span>
          </div>

          <div class="changelog-content">
            <ul class="changelog-list">
              ${listItems}
            </ul>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // 綁定點擊事件
    const headers = container.querySelectorAll('.changelog-header');
    headers.forEach(header => {
      header.addEventListener('click', function() {
        const item = this.parentElement;
        item.classList.toggle('active');
      });
    });

  } catch (error) {
    console.error('日誌載入失敗:', error);
    container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px;">載入日誌失敗 (需使用 Live Server 或網頁伺服器瀏覽)</p>';
  }
}

// 初始化輪播圖
function initHeroCarousel() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.hero-slide')];
  const dotsWrap = document.getElementById('heroDots');

  dotsWrap.innerHTML = ''; // 清空舊點

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', '前往第 ' + (i + 1) + ' 張');
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
    return b;
  });

  let index = 0;
  let timer = null;
  const interval = parseInt(slider.dataset.interval || '4000', 10);

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    const x = slides[index].offsetLeft;
    slider.scrollTo({ left: x, behavior: 'smooth' });
    updateDots();
  }

  function next() { goTo(index + 1); }
  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  let ticking = false;
  slider.addEventListener('scroll', () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      const scrollLeft = slider.scrollLeft;
      const widths = slides.map(s => s.offsetLeft);
      let nearest = 0, min = Infinity;
      for (let i = 0; i < widths.length; i++) {
        const dist = Math.abs(widths[i] - scrollLeft);
        if (dist < min) { min = dist; nearest = i; }
      }
      index = nearest;
      updateDots();
      ticking = false;
    });
    ticking = true;
  });

  function start() { stop(); timer = setInterval(next, interval); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  updateDots();
  start();

  window.addEventListener('hashchange', () => {
    const heroVisible = document.querySelector('.card.card-hero')?.offsetParent !== null;
    if (heroVisible) start(); else stop();
  });
}