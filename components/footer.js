class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        footer {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.2);
        }
        .footer-link {
          transition: color 0.3s ease;
        }
        .footer-link:hover {
          color: #8b5cf6;
        }
      </style>
      <footer class="py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white mb-4">
            Platform Ecosystem
          </h4>
              <ul class="space-y-2">
                <li><a href="https://briceka.com/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Briceka
              </a></li>
                <li><a href="https://onlycrave.com/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                OnlyCrave
              </a></li>
                <li><a href="https://trimd.cc/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Trimd
              </a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white mb-4">
            Tools & Services
          </h4>
              <ul class="space-y-2">
                <li><a href="https://briceka.com/tools/snipn/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Snipn
              </a></li>
                <li><a href="https://briceka.com/theme-detector/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Themespy
              </a></li>
                <li><a href="https://briceka.com/bypasso-link-generator/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Bypasso
              </a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white mb-4">
            Resources
          </h4>
              <ul class="space-y-2">
                <li><a href="https://support.briceka.com/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Support
              </a></li>
                <li><a href="https://briceka.com/blog/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                Blog
              </a></li>
                <li><a href="https://briceka.com/about/" target="_blank" class="footer-link text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                About
              </a></li>
              </ul>
            </div>
          </div>
          
          <div class="pt-8 mt-8 border-t border-slate-200 dark:border-slate-700 text-center">
            <p class="text-slate-600 dark:text-slate-400">
              © 2025 Briceka Enterprise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    `;
    
    feather.replace();
  }
}

customElements.define('custom-footer', CustomFooter);
