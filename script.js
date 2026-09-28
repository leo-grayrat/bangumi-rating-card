(() => {
  'use strict';

  const Logic = window.BangumiRatingLogic;
  const API_ROOT = 'https://api.bgm.tv/v0';

  const state = {
    subject: null,
    bangumiCounts: null,
    counts: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 0])),
    showRank: false,
    customLabel: '',
    exportCoverDataUrl: '',
    exportCoverSubjectId: null,
  };

  const el = {
    subjectInput: document.querySelector('#subjectInput'),
    loadSubjectBtn: document.querySelector('#loadSubjectBtn'),
    loadStatus: document.querySelector('#loadStatus'),
    subjectInfo: document.querySelector('#subjectInfo'),
    editorCover: document.querySelector('#editorCover'),
    editorCoverPlaceholder: document.querySelector('#editorCoverPlaceholder'),
    infoTitle: document.querySelector('#infoTitle'),
    infoDate: document.querySelector('#infoDate'),
    infoEps: document.querySelector('#infoEps'),
    infoId: document.querySelector('#infoId'),
    infoBgmScore: document.querySelector('#infoBgmScore'),
    infoBgmRank: document.querySelector('#infoBgmRank'),
    importRatingBtn: document.querySelector('#importRatingBtn'),
    clearRatingBtn: document.querySelector('#clearRatingBtn'),
    showRankInput: document.querySelector('#showRankInput'),
    scoreInputs: document.querySelector('#scoreInputs'),
    ratingModeText: document.querySelector('#ratingModeText'),
    customLabelInput: document.querySelector('#customLabelInput'),
    editorCustomLabel: document.querySelector('#editorCustomLabel'),
    editorScore: document.querySelector('#editorScore'),
    editorVotes: document.querySelector('#editorVotes'),
    editorStdDev: document.querySelector('#editorStdDev'),
    editorControversy: document.querySelector('#editorControversy'),
    editorRank: document.querySelector('#editorRank'),
    downloadBtn: document.querySelector('#downloadBtn'),
    openSubjectLink: document.querySelector('#openSubjectLink'),
    exportStatus: document.querySelector('#exportStatus'),
    cardTitle: document.querySelector('#cardTitle'),
    cardMeta: document.querySelector('#cardMeta'),
    cardCover: document.querySelector('#cardCover'),
    cardCoverPlaceholder: document.querySelector('#cardCoverPlaceholder'),
    globalRating: document.querySelector('#globalRating'),
    cardCustomLabel: document.querySelector('#cardCustomLabel'),
    cardCustomScore: document.querySelector('#cardCustomScore'),
    cardCustomDescription: document.querySelector('#cardCustomDescription'),
    cardBgmScore: document.querySelector('#cardBgmScore'),
    cardBgmDescription: document.querySelector('#cardBgmDescription'),
    cardRanking: document.querySelector('#cardRanking'),
    cardRankText: document.querySelector('#cardRankText'),
    cardVotes: document.querySelector('#cardVotes'),
    cardStdDev: document.querySelector('#cardStdDev'),
    cardControversy: document.querySelector('#cardControversy'),
    horizontalChart: document.querySelector('#horizontalChart'),
    capture: document.querySelector('#capture'),
  };

  buildScoreInputs();
  renderAll();

  el.loadSubjectBtn.addEventListener('click', loadSubject);
  el.subjectInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loadSubject();
  });
  el.importRatingBtn.addEventListener('click', importBangumiRating);
  el.clearRatingBtn.addEventListener('click', clearRatingForManualEntry);
  el.showRankInput.addEventListener('change', () => {
    state.showRank = el.showRankInput.checked;
    renderRating();
  });
  el.customLabelInput.addEventListener('input', () => {
    state.customLabel = el.customLabelInput.value.trim();
    renderCustomLabel();
  });
  el.downloadBtn.addEventListener('click', downloadCard);

  function buildScoreInputs() {
    const fragment = document.createDocumentFragment();
    for (let score = 10; score >= 1; score -= 1) {
      const item = document.createElement('div');
      item.className = 'score-input-item';
      const label = document.createElement('label');
      label.htmlFor = `scoreCount${score}`;
      label.textContent = score;
      const input = document.createElement('input');
      input.id = `scoreCount${score}`;
      input.className = 'score-count-input';
      input.type = 'number';
      input.min = '0';
      input.step = '1';
      input.value = '0';
      input.dataset.score = String(score);
      input.addEventListener('input', () => {
        const value = Math.max(0, Math.floor(Number(input.value) || 0));
        state.counts[score] = value;
        if (String(value) !== input.value && input.value !== '') input.value = String(value);
        el.ratingModeText.textContent = '手动编辑中';
        renderRating();
      });
      item.append(label, input);
      fragment.append(item);
    }
    el.scoreInputs.append(fragment);
  }

  async function loadSubject() {
    const id = Logic.parseSubjectId(el.subjectInput.value);
    if (!id) {
      setStatus(el.loadStatus, '无法识别条目 ID。', 'error');
      return;
    }

    el.loadSubjectBtn.disabled = true;
    setStatus(el.loadStatus, `正在读取条目 #${id}…`);
    try {
      const response = await fetch(`${API_ROOT}/subjects/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.status === 404) throw new Error('没有找到这个 Bangumi 条目。');
      if (!response.ok) throw new Error(`Bangumi API 返回 ${response.status}`);
      const data = await response.json();

      state.subject = normalizeSubject(data);
      state.bangumiCounts = Logic.normalizeCounts(data.rating?.count || {});
      state.counts = Logic.normalizeCounts({});
      state.showRank = false;
      state.exportCoverDataUrl = '';
      state.exportCoverSubjectId = null;

      el.subjectInput.value = String(state.subject.id);
      el.importRatingBtn.disabled = !data.rating?.count;
      el.showRankInput.disabled = !state.subject.rank;
      el.showRankInput.checked = false;
      el.ratingModeText.textContent = '未导入分布，可直接手填';

      renderSubject();
      renderRating();
      setStatus(el.loadStatus, `已载入 ${state.subject.title}`, 'success');
      void ensureExportCoverDataUrl(state.subject);
    } catch (error) {
      setStatus(el.loadStatus, error instanceof Error ? error.message : '载入失败。', 'error');
    } finally {
      el.loadSubjectBtn.disabled = false;
    }
  }

  function normalizeSubject(data) {
    const officialRating = Logic.calculateRating(data.rating?.count || {});
    return {
      id: Number(data.id),
      title: String(data.name_cn || data.name || `Subject ${data.id}`),
      date: String(data.date || ''),
      eps: Number(data.eps || data.eps_count || 0),
      cover: data.images?.large || data.images?.common || data.images?.medium || data.images?.grid || '',
      bgmScore: officialRating.score,
      rank: Number(data.rating?.rank || 0) || null,
      director: getInfoboxText(data.infobox, ['导演', '监督', '監督']),
      original: getInfoboxText(data.infobox, ['原作']),
      characterDesign: getInfoboxText(data.infobox, ['人物设定', '人物設定', '角色设定', '角色設定']),
    };
  }

  function getInfoboxText(infobox, keys) {
    if (!Array.isArray(infobox)) return '';
    const wanted = new Set(keys);
    const item = infobox.find((entry) => wanted.has(String(entry?.key || '').trim()));
    return infoboxValueToText(item?.value);
  }

  function infoboxValueToText(value) {
    if (typeof value === 'string') return value.trim();
    if (!Array.isArray(value)) return '';
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        return String(entry?.v || '').trim();
      })
      .filter(Boolean)
      .join('、');
  }

  function formatSearchDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return text;
    return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
  }

  async function ensureExportCoverDataUrl(subject) {
    if (!subject?.cover) return '';
    if (state.exportCoverSubjectId === subject.id && state.exportCoverDataUrl) {
      return state.exportCoverDataUrl;
    }

    const sources = [
      `${API_ROOT}/subjects/${subject.id}/image?type=large`,
      `https://wsrv.nl/?url=${encodeURIComponent(subject.cover)}`,
    ];

    for (const source of sources) {
      try {
        const dataUrl = await fetchImageAsDataUrl(source);
        if (!dataUrl) continue;
        if (state.subject?.id !== subject.id) return '';
        state.exportCoverDataUrl = dataUrl;
        state.exportCoverSubjectId = subject.id;
        return dataUrl;
      } catch (_) {
        // 当前来源失败时继续尝试下一个来源。
      }
    }

    return '';
  }

  async function fetchImageAsDataUrl(url) {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache',
    });
    if (!response.ok) throw new Error(`图片请求失败：${response.status}`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('返回内容不是图片');
    return blobToDataUrl(blob);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('图片转换失败'));
      reader.readAsDataURL(blob);
    });
  }

  function waitForImageSource(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('封面解码失败'));
      image.src = src;
    });
  }

  function importBangumiRating() {
    if (!state.subject || !state.bangumiCounts) return;
    state.counts = Logic.normalizeCounts(state.bangumiCounts);
    state.showRank = Boolean(state.subject.rank);
    el.showRankInput.checked = state.showRank;
    el.ratingModeText.textContent = '已导入 Bangumi 分布，可继续修改';
    syncCountInputs();
    renderRating();
  }

  function clearRatingForManualEntry() {
    state.counts = Logic.normalizeCounts({});
    state.showRank = false;
    el.showRankInput.checked = false;
    el.ratingModeText.textContent = state.subject ? '手动填写' : '等待条目';
    syncCountInputs();
    renderRating();
  }

  function syncCountInputs() {
    el.scoreInputs.querySelectorAll('.score-count-input').forEach((input) => {
      const score = Number(input.dataset.score);
      input.value = String(state.counts[score] || 0);
    });
  }

  function renderAll() {
    renderSubject();
    renderCustomLabel();
    renderRating();
  }

  function renderSubject() {
    const subject = state.subject;
    if (!subject) {
      el.subjectInfo.classList.add('is-empty');
      setText(el.infoTitle, '—');
      setText(el.infoDate, '—');
      setText(el.infoEps, '—');
      setText(el.infoId, '—');
      setText(el.infoBgmScore, '—');
      setText(el.infoBgmRank, 'Rank —');
      setText(el.cardTitle, '请先载入 Bangumi 条目');
      setText(el.cardMeta, '');
      setText(el.cardBgmScore, '--');
      setText(el.cardBgmDescription, '');
      setCover(el.editorCover, el.editorCoverPlaceholder, '');
      setCover(el.cardCover, el.cardCoverPlaceholder, '');
      el.openSubjectLink.classList.add('disabled-link');
      el.openSubjectLink.href = '#';
      return;
    }

    const bgmScoreText = subject.bgmScore == null ? '--' : subject.bgmScore.toFixed(3);

    el.subjectInfo.classList.remove('is-empty');
    setText(el.infoTitle, subject.title);
    setText(el.infoDate, subject.date || '—');
    setText(el.infoEps, subject.eps ? `${subject.eps} 话` : '—');
    setText(el.infoId, String(subject.id));
    setText(el.infoBgmScore, bgmScoreText);
    setText(el.infoBgmRank, subject.rank ? `Rank #${subject.rank}` : 'Rank —');
    setText(el.cardTitle, subject.title);
    setText(el.cardBgmScore, bgmScoreText);
    setText(el.cardBgmDescription, Logic.scoreDescription(subject.bgmScore));

    const meta = [
      formatSearchDate(subject.date),
      subject.director,
      subject.original,
      subject.characterDesign,
    ].filter(Boolean);
    setText(el.cardMeta, meta.join(' / '));

    setCover(el.editorCover, el.editorCoverPlaceholder, subject.cover);
    setCover(el.cardCover, el.cardCoverPlaceholder, subject.cover);
    el.openSubjectLink.href = `https://bgm.tv/subject/${subject.id}`;
    el.openSubjectLink.classList.remove('disabled-link');
  }

  function renderCustomLabel() {
    const text = `${state.customLabel || '???'}评分`;
    setText(el.editorCustomLabel, text);
    setText(el.cardCustomLabel, text);
  }

  function renderRating() {
    const rating = Logic.calculateRating(state.counts);
    const scoreText = rating.score == null ? '--' : rating.score.toFixed(3);
    const stdDevText = rating.stdDev == null ? '--' : rating.stdDev.toFixed(4);
    const description = Logic.scoreDescription(rating.score);
    const controversy = rating.controversy || '--';

    setText(el.editorScore, scoreText);
    setText(el.editorVotes, String(rating.total));
    setText(el.editorStdDev, stdDevText);
    setText(el.editorControversy, controversy);
    setText(el.cardCustomScore, scoreText);
    setText(el.cardCustomDescription, description);
    setText(el.cardVotes, String(rating.total));
    setText(el.cardStdDev, stdDevText);
    setText(el.cardControversy, controversy);

    const scoreClass = Logic.scoreClass(rating.score);
    el.globalRating.className = `global_rating ${scoreClass}`;

    const canShowRank = Boolean(state.subject?.rank && state.showRank);
    el.cardRanking.hidden = !canShowRank;
    el.editorRank.hidden = !canShowRank;
    if (canShowRank) {
      setText(el.cardRankText, `#${state.subject.rank}`);
      setText(el.editorRank, `Rank #${state.subject.rank}`);
    }

    el.horizontalChart.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const bar of rating.bars) {
      const li = document.createElement('li');
      li.title = `${bar.count}人`;
      const count = document.createElement('span');
      count.className = 'count';
      count.style.height = `${bar.height}%`;
      count.textContent = String(bar.count);
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = String(bar.score);
      li.append(count, label);
      fragment.append(li);
    }
    el.horizontalChart.append(fragment);
  }

  function setCover(image, placeholder, src) {
    image.onload = null;
    image.onerror = null;
    image.removeAttribute('crossorigin');

    if (!src) {
      image.removeAttribute('src');
      image.hidden = true;
      placeholder.hidden = false;
      return;
    }

    image.onload = () => {
      image.hidden = false;
      placeholder.hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      placeholder.hidden = false;
    };

    image.src = src;
    image.hidden = false;
    placeholder.hidden = true;
  }

  function setText(node, value) {
    node.textContent = value;
  }

  function setStatus(node, message, type = '') {
    node.textContent = message;
    node.className = `status-line${type ? ` ${type}` : ''}`;
  }

  async function downloadCard() {
    if (!state.subject) {
      setStatus(el.exportStatus, '请先载入一个 Bangumi 条目。', 'error');
      return;
    }
    if (typeof window.html2canvas !== 'function') {
      setStatus(el.exportStatus, '图片导出组件未载入，请检查网络后重试。', 'error');
      return;
    }

    const subjectAtStart = state.subject;
    el.downloadBtn.disabled = true;
    setStatus(el.exportStatus, '正在准备封面并生成 PNG…');

    try {
      if (document.fonts?.ready) await document.fonts.ready;

      const exportCoverDataUrl = await ensureExportCoverDataUrl(subjectAtStart);
      if (state.subject?.id !== subjectAtStart.id) throw new Error('条目已发生变化，请重新导出。');
      if (subjectAtStart.cover && !exportCoverDataUrl) {
        throw new Error('封面无法转换成可导出的图片，请稍后重试。');
      }
      if (exportCoverDataUrl) await waitForImageSource(exportCoverDataUrl);

      const canvas = await window.html2canvas(el.capture, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        onclone: (clonedDocument) => {
          if (!exportCoverDataUrl) return;
          const clonedCover = clonedDocument.querySelector('#cardCover');
          const clonedPlaceholder = clonedDocument.querySelector('#cardCoverPlaceholder');
          if (!clonedCover) return;
          clonedCover.removeAttribute('crossorigin');
          clonedCover.src = exportCoverDataUrl;
          clonedCover.hidden = false;
          if (clonedPlaceholder) clonedPlaceholder.hidden = true;
        },
      });

      const link = document.createElement('a');
      link.download = `bangumi-rating-${subjectAtStart.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus(el.exportStatus, 'PNG 已生成。', 'success');
    } catch (error) {
      setStatus(el.exportStatus, `导出失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      el.downloadBtn.disabled = false;
    }
  }
})();
