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

  // 6. Динамическая синхронизация данных с Twitch (био, фолловеры, статус эфира)
  async function syncTwitchChannel() {
    const CHANNEL_LOGIN = 'sladokacs';
    const GQL_URL = 'https://gql.twitch.tv/gql';
    const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

    const bioEl = document.getElementById('twitch-bio');
    const followersEl = document.getElementById('twitch-followers-count');
    const targetEl = document.getElementById('twitch-followers-target');
    const barEl = document.getElementById('twitch-followers-bar');
    const avatarEl = document.getElementById('twitch-avatar');
    const statusBadge = document.getElementById('twitch-status-badge');
    const statusText = document.getElementById('twitch-status-text');
    const liveBanner = document.getElementById('live-stream-banner');
    const liveTitle = document.getElementById('live-stream-title');
    const liveMeta = document.getElementById('live-stream-meta');

    function updateFollowersUI(count) {
      if (!followersEl) return;
      followersEl.textContent = count.toLocaleString('ru-RU');
      if (barEl) {
        const target = parseInt(targetEl?.textContent, 10) || 1000;
        const percent = Math.min(100, Math.max(0, (count / target) * 100)).toFixed(1);
        barEl.style.width = `${percent}%`;
      }
    }

    try {
      const gqlQuery = {
        operationName: 'TwitchLiveChannelSync',
        variables: { channel: CHANNEL_LOGIN },
        query: `
          query TwitchLiveChannelSync($channel: String!) {
            user(login: $channel) {
              id
              displayName
              description
              profileImageURL(width: 300)
              followers {
                totalCount
              }
              stream {
                id
                title
                viewersCount
                game {
                  name
                }
              }
            }
          }
        `,
      };

      const response = await fetch(GQL_URL, {
        method: 'POST',
        headers: {
          'Client-Id': CLIENT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([gqlQuery]),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const [payload] = await response.json();
      const user = payload?.data?.user;
      if (!user) throw new Error('User data not found in Twitch response');

      // 1. Описание профиля / Био
      if (user.description && bioEl) {
        bioEl.textContent = user.description;
      }

      // 2. Аватарка (если обновилась)
      if (user.profileImageURL && avatarEl && avatarEl.src !== user.profileImageURL) {
        avatarEl.src = user.profileImageURL;
      }

      // 3. Фолловеры и прогресс-бар цели
      if (typeof user.followers?.totalCount === 'number') {
        updateFollowersUI(user.followers.totalCount);
      }

      // 4. Прямой эфир (онлайн / оффлайн)
      if (user.stream) {
        // Стрим идёт прямо сейчас
        if (statusBadge) {
          statusBadge.classList.add('is-live');
          statusBadge.classList.remove('is-offline');
        }
        if (statusText) {
          statusText.textContent = 'В ЭФИРЕ 🔴';
        }
        if (liveBanner) {
          if (liveTitle) {
            liveTitle.textContent = user.stream.title || 'Стрим Куси прямо сейчас!';
          }
          if (liveMeta) {
            const gameName = user.stream.game?.name || 'Counter-Strike 2';
            const viewers = user.stream.viewersCount || 0;
            liveMeta.textContent = `🎮 ${gameName} • ${viewers} зрителей`;
          }
          liveBanner.style.display = 'flex';
        }
      } else {
        // Канал оффлайн
        if (statusBadge) {
          statusBadge.classList.remove('is-live');
          statusBadge.classList.add('is-offline');
        }
        if (statusText) {
          statusText.textContent = 'ОФФЛАЙН';
        }
        if (liveBanner) {
          liveBanner.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('Twitch GQL Sync error, falling back to DecAPI:', err);

      // Резервный канал (DecAPI) на случай блокировок или сбоев GQL
      try {
        const fallbackRes = await fetch(`https://decapi.me/twitch/followcount/${CHANNEL_LOGIN}`);
        if (fallbackRes.ok) {
          const countText = await fallbackRes.text();
          const count = parseInt(countText.trim(), 10);
          if (!isNaN(count) && count > 0) {
            updateFollowersUI(count);
          }
        }
      } catch (fallbackErr) {
        console.warn('DecAPI fallback failed:', fallbackErr);
      }
    }
  }

  // Запуск синхронизации сразу при загрузке страницы
  syncTwitchChannel();

  // Периодическая проверка каждые 60 секунд (если вкладка открыта)
  setInterval(syncTwitchChannel, 60000);
});
