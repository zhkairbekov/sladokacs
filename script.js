document.addEventListener('DOMContentLoaded', () => {
  // 1. Автоматический перевод расписания (17:00 - 21:00 МСК / UTC+3) в часовой пояс зрителя
  const localTimeEl = document.getElementById('local-schedule-time');
  if (localTimeEl) {
    try {
      // МСК = UTC+3 -> 17:00 МСК = 14:00 UTC, 21:00 МСК = 18:00 UTC
      const startUtc = new Date(Date.UTC(2026, 9, 25, 14, 0, 0));
      const endUtc = new Date(Date.UTC(2026, 9, 25, 18, 0, 0));
      const fmt = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      localTimeEl.textContent = `По вашему времени: ${fmt.format(startUtc)} – ${fmt.format(endUtc)} (${tzName})`;
    } catch (e) {
      localTimeEl.textContent = 'Каждый день 17:00 – 21:00 по МСК';
    }
  }

  // 2. Фильтрация меню донатов и алертов
  const tabButtons = document.querySelectorAll('.tab-btn');
  const donateItems = document.querySelectorAll('.donate-item');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-filter');
      donateItems.forEach((item) => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // 3. Аккордеон F.A.Q.
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  // 4. Модальное окно для жителей Кыргызстана и лайтбокса картинок-панелей Куси
  const openKgBtn = document.getElementById('open-kg-modal');
  const openKgCard = document.getElementById('open-kg-card');
  const closeKgBtn = document.getElementById('close-kg-modal');
  const kgModal = document.getElementById('kg-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalImg = document.getElementById('modal-img');

  function openModal(imgSrc, titleText) {
    if (!kgModal || !modalImg || !modalTitle) return;
    modalImg.src = imgSrc;
    modalImg.alt = titleText;
    modalTitle.textContent = titleText;
    kgModal.classList.add('open');
  }

  if (openKgBtn) {
    openKgBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('assets/panels/panel-kg.png', '🇰🇬 ДЛЯ ЖИТЕЛЕЙ КЫРГЫЗСТАНА ня!');
    });
  }

  if (openKgCard) {
    openKgCard.addEventListener('click', () => {
      openModal('assets/panels/panel-kg.png', '🇰🇬 ДЛЯ ЖИТЕЛЕЙ КЫРГЫЗСТАНА ня!');
    });
  }

  document.querySelectorAll('.lightbox-trigger').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const imgSrc = trigger.getAttribute('data-img');
      const titleText = trigger.getAttribute('data-title') || '୨୧ SLADOKACS';
      if (imgSrc) {
        openModal(imgSrc, titleText);
      }
    });
  });

  if (closeKgBtn && kgModal) {
    closeKgBtn.addEventListener('click', () => {
      kgModal.classList.remove('open');
    });

    kgModal.addEventListener('click', (e) => {
      if (e.target === kgModal) {
        kgModal.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        kgModal.classList.remove('open');
      }
    });
  }

  // 5. Подсветка активного пункта в десктопном и мобильном нижнем меню при скролле и клике
  const navSpyLinks = document.querySelectorAll('.nav-spy');
  const sections = document.querySelectorAll('main .section');

  function setActiveSection(id) {
    navSpyLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  navSpyLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('href').replace('#', '');
      setActiveSection(targetId);
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      let currentId = 'links';
      const scrollPos = window.scrollY + 220;

      sections.forEach((section) => {
        if (scrollPos >= section.offsetTop) {
          currentId = section.getAttribute('id');
        }
      });

      setActiveSection(currentId);
    },
    { passive: true }
  );
});
