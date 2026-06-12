document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Footer Year
    const footerText = document.querySelector('.footer p');
    if (footerText) {
        footerText.innerHTML = `© ${new Date().getFullYear()} Coffeeblackcat. All rights reserved.`;
    }

    // Custom Toast Notification
    function showToast(message) {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Share Button Logic
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: 'Coffeeblackcat',
                text: 'Check out my favorite coffee gear!',
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Link copied to clipboard! 📋');
                } catch (err) {
                    showToast('Sharing not supported. Copy link manually.');
                }
            }
        });
    }

    // Email Button Logic
    const emailBtn = document.getElementById('email-btn');
    if (emailBtn) {
        emailBtn.addEventListener('click', async (e) => {
            const isMobile = window.innerWidth < 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

            if (!isMobile) {
                e.preventDefault();
                try {
                    await navigator.clipboard.writeText('hello@cofbla.com');
                    showToast('Email address copied! 📧');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showToast('Could not copy. hello@cofbla.com');
                }
            }
        });
    }

    // Supabase Initialization
    let supabaseClient = null;
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Render links dynamically
    async function initLinks() {
        const linksSection = document.querySelector('.links-section');
        if (!linksSection) return;

        let links = FALLBACK_LINKS;

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('links')
                    .select('*')
                    .order('position', { ascending: true });

                if (error) throw error;
                if (data && data.length > 0) {
                    links = data;
                }
            } catch (err) {
                console.warn('Error fetching from Supabase, using fallback links:', err);
            }
        }

        // Keep the title header and clear previous cards
        const titleElement = linksSection.querySelector('.section-title');
        linksSection.innerHTML = '';
        if (titleElement) {
            linksSection.appendChild(titleElement);
        }

        // Render each card
        links.forEach((item, index) => {
            const card = document.createElement('a');
            card.href = item.url;
            card.className = 'link-card';
            card.target = '_blank';
            
            // Stagger animation delay
            card.style.animationDelay = `${0.2 + index * 0.1}s`;

            // Prepare discount badges
            let discountHtml = '';
            if (item.discount) {
                discountHtml += `<span class="discount">${item.discount}</span>`;
            }
            if (item.code) {
                // If code starts with "CODE:", don't double repeat it
                const cleanedCode = item.code.toUpperCase().startsWith('CODE:') ? item.code.substring(5) : item.code;
                discountHtml += `<span class="discount">CODE:${cleanedCode}</span>`;
            }

            card.innerHTML = `
                <div class="link-icon">
                    <img src="${item.image_url}" alt="${item.title}" onerror="this.src='profile_placeholder.png'">
                </div>
                <div class="link-content">
                    <h2>${item.title}</h2>
                    <p>${item.price || ''} ${discountHtml}</p>
                </div>
                <div class="link-arrow">→</div>
            `;

            linksSection.appendChild(card);
        });

        // Re-apply tilt effect to dynamically created cards
        applyTiltEffect();
    }

    // Tilt Effect for Cards
    function applyTiltEffect() {
        const cards = document.querySelectorAll('.link-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg
                const rotateY = ((x - centerX) / centerX) * 5;  // Max 5deg

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    // Load the links
    initLinks();
});
