/**
 * Centralized Component Registry for standardizing HTML injection.
 */
export const ComponentRegistry = {
  
  /**
   * Generates a Placement Question Block (MCQ)
   */
  renderMCQ(data) {
    return `
      <div class="mcq-panel" data-difficulty="${data.difficulty}">
        <div class="flex-between">
          <strong>${data.question}</strong>
          <span class="badge badge-${data.difficulty}">${data.difficulty.toUpperCase()}</span>
        </div>
        <div class="mcq-options stack mt-4">
          ${data.options.map(opt => `
            <div class="mcq-option" data-correct="${opt === data.answer}">
              ${opt}
            </div>
          `).join('')}
        </div>
        <div class="mcq-explanation mt-4 p-4 bg-surface rounded hidden">
          <small class="text-secondary">${data.explanation}</small>
        </div>
      </div>
    `;
  },

  /**
   * Generates a Syntax Highlighted Code Block
   */
  renderCodeBlock(lang, code) {
    return `
      <div class="relative group">
        <button class="copy-btn btn btn-outline absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
        <pre class="language-${lang}"><code class="language-${lang}">${code}</code></pre>
      </div>
    `;
  },

  /**
   * Placeholder for Terminal Mount Point
   */
  renderTerminalMount(id, prompt) {
    return `
      <div id="term-mount-${id}" class="terminal-container" data-prompt="${prompt}">
        <!-- Dynamic Terminal Engine Will Mount Here -->
      </div>
    `;
  }
};
