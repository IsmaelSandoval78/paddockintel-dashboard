function renderAdvancedAnalytics() {
    const data = driverCachedData.analytics;
    if (!data) return;

    // --- INFOGRAFÍA 1: Sunday Progress Index ---
    const bodyProgress = createOrGetModuleCard('csv-progress-card', 'sunday_progress_title', 'verified_tag');
    if (bodyProgress) {
        const idx = data.progressIndex;
        const isPositive = idx >= 0;
        const arrow = isPositive ? '↑' : '↓';
        const colorClass = isPositive ? 'text-green' : 'text-red';
        const labelText = isPositive ? _t('positions_gained') : _t('positions_lost');
        
        bodyProgress.innerHTML = `
          <div class="apple-analytics-flex">
              <div class="apple-big-stat-block">
                  <div class="apple-stat-big-num ${colorClass}">${arrow}${Math.abs(idx)}</div>
                  <div class="apple-stat-big-desc">${labelText}</div>
              </div>
              <div class="apple-sub-metrics-list">
                  <div class="apple-sub-metric-item">
                      <span class="apple-sub-label">${_t('avg_start_label')}</span>
                      <span class="apple-sub-val">P${data.avgStart}</span>
                  </div>
                  <div class="apple-sub-metric-item">
                      <span class="apple-sub-label">${_t('avg_finish_label')}</span>
                      <span class="apple-sub-val">P${data.avgFinish}</span>
                  </div>
              </div>
          </div>
        `;
    }

    // --- NUEVO 🚀: INFOGRAFÍA 2: Qualifying Battle Index ---
    const bodyQualy = createOrGetModuleCard('csv-qualy-battle-card', 'qualifying_battle_title', 'verified_tag');
    if (bodyQualy) {
        const q = data.qualyBattle || { "score": "0 - 0", "teammate": "TM" };
        bodyQualy.innerHTML = `
          <div class="apple-analytics-flex">
              <div class="apple-big-stat-block">
                  <div class="apple-stat-big-num" style="color: var(--text-charcoal);">${q.score}</div>
                  <div class="apple-stat-big-desc">${_t('battle_desc')}</div>
              </div>
              <div class="apple-sub-metrics-list">
                  <div class="apple-sub-metric-item">
                      <span class="apple-sub-label">${_t('teammate_duel_label')}</span>
                      <span class="apple-sub-val" style="background: #1d1d1f; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px;">vs ${q.teammate}</span>
                  </div>
                  <div class="apple-sub-metric-item">
                      <span class="apple-sub-label">${_t('avg_qualy_label')}</span>
                      <span class="apple-sub-val">P${data.avgQualy}</span>
                  </div>
              </div>
          </div>
        `;
    }

    // --- INFOGRAFÍA 3: Damage & Reliability Report ---
    const bodyReliability = createOrGetModuleCard('csv-reliability-card', 'damage_reliability_title', 'verified_tag');
    if (bodyReliability) {
        const rel = data.reliability;
        bodyReliability.innerHTML = `
          <div class="apple-reliability-container">
              <div class="apple-progress-row">
                  <div class="apple-progress-text-split">
                      <span>${_t('completion_rate_label')}</span>
                      <strong>${rel.completionRate}%</strong>
                  </div>
                  <div class="apple-progress-bar-bg">
                      <div class="apple-progress-bar-fill" style="width: ${rel.completionRate}%; background: #1d1d1f;"></div>
                  </div>
              </div>
              <div class="apple-progress-row">
                  <div class="apple-progress-text-split">
                      <span>${_t('driver_error_label')}</span>
                      <strong style="color: var(--f1-red);">${rel.driverErrorRate}%</strong>
                  </div>
                  <div class="apple-progress-bar-bg">
                      <div class="apple-progress-bar-fill" style="width: ${rel.driverErrorRate}%; background: var(--f1-red); opacity: 0.8;"></div>
                  </div>
              </div>
              <div class="apple-progress-row">
                  <div class="apple-progress-text-split">
                      <span>${_t('mech_failure_label')}</span>
                      <strong style="color: #0066cc;">${rel.mechanicalFailureRate}%</strong>
                  </div>
                  <div class="apple-progress-bar-bg">
                      <div class="apple-progress-bar-fill" style="width: ${rel.mechanicalFailureRate}%; background: #0066cc; opacity: 0.8;"></div>
                  </div>
              </div>
              <div class="apple-reliability-footer">
                  Total DNFs: <strong>${rel.totalDNFs}</strong>
              </div>
          </div>
        `;
    }
}