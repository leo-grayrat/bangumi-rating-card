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
    customScore: null,
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
    importRatingBtn: document.querySelector('#importRatingBtn'),
    clearRatingBtn: document.querySelector('#clearRatingBtn'),
    showRankInput: document.querySelector('#showRankInput'),
    scoreInputs: document.querySelector('#scoreInputs'),
    ratingModeText: document.querySelector('#ratingModeText'),
    editorScore: document.querySelector('#editorScore'),
    editorVotes: document.querySelector('#editorVotes'),
    editorStdDev: document.querySelector('#editorStdDev'),
    editorControversy: document.querySelector('#editorControversy'),
    editorRank: document.querySelector('#editorRank'),
    customLabelInput: document.querySelector('#customLabelInput'),
    customScoreInput: document.querySelector('#customScoreInput'),
    downloadBtn: document.querySelector('#downloadBtn'),
    openSubjectLink: document.querySelector('#openSubjectLink'),
    exportStatus: document.querySelector('#exportStatus'),
    globalRating: document.querySelector('#globalRating'),
    customScoreLabel: document.querySelector('#customScoreLabel'),
    customScoreValue: document.querySelector('#customScoreValue'),
    customScoreDescription: document.querySelector('#customScoreDescription'),
    cardScore: document.querySelector('#cardScore'),
    cardDescription: document.querySelector('#cardDescription'),
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
    renderCustomRating();
  });
  el.customScoreInput.addEventListener('input', () => {
    const value = Number(el.customScoreInput.value);
    state.customScore = el.customScoreInput.value === '' || !Number.isFinite(value)
      ? null
      : Math.max(0, Math.min(10, value));
    renderCustomRating();
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

      el.subjectInput.value = String(state.subject.id);
      el.importRatingBtn.disabled = !data.rating;
      el.showRankInput.disabled = !state.subject.rank;
      el.showRankInput.checked = false;
      el.ratingModeText.textContent = '未导入评分，可直接手填';

      renderSubject();
      renderRating();
      setStatus(el.loadStatus, `已载入 ${state.subject.title}`, 'success');
    } catch (error) {
      setStatus(el.loadStatus, error instanceof Error ? error.message : '载入失败。', 'error');
    } finally {
      el.loadSubjectBtn.disabled = false;
    }
  }

  function normalizeSubject(data) {
    return {
      id: Number(data.id),
      title: String(data.name_cn || data.name || `Subject ${data.id}`),
      date: String(data.date || ''),
      eps: Number(data.eps || data.eps_count || 0),
      cover: data.images?.large || data.images?.common || data.images?.medium || data.images?.grid || '',
      rank: Number(data.rating?.rank || 0) || null,
    };
  }

  function importBangumiRating() {
    if (!state.subject || !state.bangumiCounts) return;
    state.counts = Logic.normalizeCounts(state.bangumiCounts);
    state.showRank = Boolean(state.subject.rank);
    el.showRankInput.checked = state.showRank;
    el.ratingModeText.textContent = 'Bangumi 评分已导入，可继续修改';
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
    renderRating();
    renderCustomRating();
  }

  function renderSubject() {
    const subject = state.subject;
    if (!subject) {
      el.subjectInfo.classList.add('is-empty');
      setText(el.infoTitle, '—');
      setText(el.infoDate, '—');
      setText(el.infoEps, '—');
      setText(el.infoId, '—');
      setCover(el.editorCover, el.editorCoverPlaceholder, '');
      el.openSubjectLink.classList.add('disabled-link');
      el.openSubjectLink.href = '#';
      return;
    }

    el.subjectInfo.classList.remove('is-empty');
    setText(el.infoTitle, subject.title);
    setText(el.infoDate, subject.date || '—');
    setText(el.infoEps, subject.eps ? `${subject.eps} 话` : '—');
    setText(el.infoId, String(subject.id));
    setCover(el.editorCover, el.editorCoverPlaceholder, subject.cover);
    el.openSubjectLink.href = `https://bgm.tv/subject/${subject.id}`;
    el.openSubjectLink.classList.remove('disabled-link');
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
    setText(el.cardScore, scoreText);
    setText(el.cardDescription, description);
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

  function renderCustomRating() {
    const label = state.customLabel ? `${state.customLabel}评分` : '???评分';
    const scoreText = state.customScore == null ? '--' : state.customScore.toFixed(3);
    setText(el.customScoreLabel, label);
    setText(el.customScoreValue, scoreText);
    setText(el.customScoreDescription, Logic.scoreDescription(state.customScore));
  }

  function setCover(image, placeholder, src) {
    if (src) {
      image.src = src;
      image.hidden = false;
      placeholder.hidden = true;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
      placeholder.hidden = false;
    }
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

    el.downloadBtn.disabled = true;
    setStatus(el.exportStatus, '正在生成 PNG…');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await window.html2canvas(el.capture, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `bangumi-rating-${state.subject.id}.png`;
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
