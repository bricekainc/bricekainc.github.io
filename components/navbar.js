class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          z-index: 50;
        }
        nav {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.2);
        }
        .nav-link {
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .mobile-menu {
            display: none;
          }
        }
      </style>
      <nav class="sticky top-0 px-4 sm:px-6 lg:px-8 py-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" class="flex items-center gap-2 nav-link">
            <i data-feather="zap" class="w-6 h-6 text-purple-600"></i>
            <span class="text-xl font-bold text-slate-900 dark:text-white">
          Briceka Universe
        </span>
          </a>
          
          <div class="hidden md:flex items-center gap-6">
            <button onclick="toggleTheme()" class="nav-link bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-all duration-300">
            <i data-feather="moon" class="w-4 h-4"></i>
          </button>
        </div>
        
        <div class="md:hidden">
          <button id="mobileMenuBtn" class="nav-link">
              <i data-feather="menu" class="w-6 h-6"></i>
            </button>
          </div>
        </nav>
        
        <!-- Mobile Menu -->
        <div id="mobileMenu" class="mobile-menu absolute top-full left-0 right-0 bg-white dark:bg-slate-800 shadow-xl border-t border-slate-200 dark:border-slate-700">
          <div class="px-4 py-6">
            <button onclick="loadIframe('https://briceka.com/')" class="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <i data-feather="globe" class="w-4 h-4 mr-3"></i>
            Briceka Main
          </button>
            <button onclick="loadIframe('https://briceka.com/onlycrave/')" class="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <i data-feather="users" class="w-4 h-4 mr-3"></i>
            OnlyCrave
          </button>
            <button onclick="loadIframe('https://briceka.com/trimd/')" class="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <i data-feather="link" class="w-4 h-4 mr-3"></i>
            Trimd
          </button>
            <button onclick="loadIframe('https://briceka.com/tools/snipn/index.php?embed=true')" class="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <i data-feather="dollar-sign" class="w-4 h-4 mr-3"></i>
            Snipn
          </button>
          </div>
        </div>
    `;
    
    // Mobile menu functionality
    const mobileMenuBtn = this.shadowRoot.getElementById('mobileMenuBtn');
    const mobileMenu = this.shadowRoot.getElementById('mobileMenu');
    
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.contains(event.target)) {
        mobileMenu.style.display = 'none';
      });
    });
    
    feather.replace();
  }
}

customElements.define('custom-navbar', CustomNavbar);
