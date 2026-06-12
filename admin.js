// Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Whitelisted administrator emails
    // IMPORTANT: Add your Gmail address here!
    const ADMIN_EMAILS = [
        "post@emresar.com"
    ];

    // UI Elements
    const loadingScreen = document.getElementById('loading-screen');
    const authScreen = document.getElementById('auth-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    const dashboardContent = document.getElementById('dashboard-content');
    const accessDenied = document.getElementById('access-denied');
    const deniedEmailText = document.getElementById('denied-email');
    const loginDiffBtn = document.getElementById('login-diff-btn');
    const setupBanner = document.getElementById('setup-banner');
    
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authError = document.getElementById('auth-error');
    
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    const newItemBtn = document.getElementById('new-item-btn');
    const itemForm = document.getElementById('item-form');
    const formHeaderTitle = document.getElementById('form-header-title');
    const cancelFormBtn = document.getElementById('cancel-form-btn');
    const saveFormBtn = document.getElementById('save-form-btn');
    
    const operationLoader = document.getElementById('operation-loader');
    const operationText = document.getElementById('operation-text');
    const cardsList = document.getElementById('cards-list');
    const importDefaultsBtn = document.getElementById('import-defaults-btn');

    // Form Inputs
    const inputId = document.getElementById('item-id');
    const inputPosition = document.getElementById('item-position');
    const inputTitle = document.getElementById('input-title');
    const inputUrl = document.getElementById('input-url');
    const inputPrice = document.getElementById('input-price');
    const inputDiscount = document.getElementById('input-discount');
    const inputCode = document.getElementById('input-code');
    const inputImage = document.getElementById('input-image');
    const previewImg = document.getElementById('preview-img');

    // State
    let isEditMode = false;
    let localLinks = []; // Used in local/fallback mode
    let isSupabaseConfigured = false;
    let supabaseClient = null;

    // Toast Notification
    function showToast(message) {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Initialize Supabase & Check config
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseConfigured = true;
    } else {
        console.warn("Supabase credentials not found in config.js. Running in Local Fallback mode.");
        setupBanner.style.display = 'block';
        // Initialize localStorage with current links if empty
        if (!localStorage.getItem('linktree_links')) {
            localStorage.setItem('linktree_links', JSON.stringify(FALLBACK_LINKS));
        }
        localLinks = JSON.parse(localStorage.getItem('linktree_links'));
    }

    // Show/Hide Operation Loading State
    function setOperationLoading(isLoading, text = "Saving...") {
        if (isLoading) {
            operationText.textContent = text;
            operationLoader.style.display = 'block';
            saveFormBtn.disabled = true;
        } else {
            operationLoader.style.display = 'none';
            saveFormBtn.disabled = false;
        }
    }

    // --- Authentication Logic ---
    async function checkUser(user) {
        if (!user) {
            // No user, show login
            loadingScreen.style.display = 'none';
            authScreen.style.display = 'flex';
            adminDashboard.style.display = 'none';
            return;
        }

        // Whitelist Check
        const email = user.email.toLowerCase();
        
        // In Local Fallback mode (demo mode), let any email pass or if whitelist has default emails
        const isAuthorized = !isSupabaseConfigured || ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email) || ADMIN_EMAILS.includes("emre@example.com");

        if (isAuthorized) {
            // User is Admin
            userAvatar.src = user.user_metadata?.avatar_url || 'profile_placeholder.png';
            userName.textContent = user.user_metadata?.full_name || 'Administrator';
            userEmail.textContent = email;
            
            authScreen.style.display = 'none';
            adminDashboard.style.display = 'flex';
            accessDenied.style.display = 'none';
            dashboardContent.style.display = 'flex';
            
            if (isSupabaseConfigured && importDefaultsBtn) {
                importDefaultsBtn.style.display = 'inline-block';
            }
            
            loadingScreen.style.display = 'none';
            loadLinks();
        } else {
            // User Logged In but Not Whitelisted
            userAvatar.src = user.user_metadata?.avatar_url || 'profile_placeholder.png';
            userName.textContent = user.user_metadata?.full_name || 'User';
            userEmail.textContent = email;

            authScreen.style.display = 'none';
            adminDashboard.style.display = 'flex';
            dashboardContent.style.display = 'none';
            
            deniedEmailText.textContent = email;
            accessDenied.style.display = 'block';
            loadingScreen.style.display = 'none';
        }
    }

    // Google Login Trigger
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            if (isSupabaseConfigured) {
                authError.style.display = 'none';
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + window.location.pathname
                    }
                });
                if (error) {
                    authError.textContent = error.message;
                    authError.style.display = 'block';
                }
            } else {
                // local demo mode login bypass
                showToast("Bypassing login (Local Demo Mode) 🚀");
                checkUser({
                    email: "emre@example.com",
                    user_metadata: {
                        full_name: "Demo Admin",
                        avatar_url: "profile_black_cat.png"
                    }
                });
            }
        });
    }

    // Sign Out Trigger
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (isSupabaseConfigured) {
                await supabaseClient.auth.signOut();
                window.location.reload();
            } else {
                window.location.reload();
            }
        });
    }

    if (loginDiffBtn) {
        loginDiffBtn.addEventListener('click', async () => {
            if (isSupabaseConfigured) {
                await supabaseClient.auth.signOut();
            }
            window.location.reload();
        });
    }

    // Check auth status on load
    if (isSupabaseConfigured) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            checkUser(session?.user || null);
        });

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            checkUser(session?.user || null);
        });
    } else {
        // In local mode, auto login to demo admin
        setTimeout(() => {
            checkUser({
                email: "emre@example.com",
                user_metadata: {
                    full_name: "Demo Admin",
                    avatar_url: "profile_black_cat.png"
                }
            });
        }, 800);
    }

    // Import Default Gear Links
    if (importDefaultsBtn) {
        importDefaultsBtn.addEventListener('click', async () => {
            if (!confirm("Would you like to import all the original default coffee gear items into your database? This will help restore your original links.")) {
                return;
            }
            
            setOperationLoading(true, "Importing default gear...");
            
            try {
                if (isSupabaseConfigured) {
                    for (let i = 0; i < FALLBACK_LINKS.length; i++) {
                        const item = FALLBACK_LINKS[i];
                        
                        // Check if item already exists by title
                        const { data: existing } = await supabaseClient
                            .from('links')
                            .select('id')
                            .eq('title', item.title)
                            .limit(1);
                            
                        if (existing && existing.length > 0) {
                            continue; // skip duplicate
                        }

                        const { error } = await supabaseClient
                            .from('links')
                            .insert([{
                                title: item.title,
                                url: item.url,
                                price: item.price,
                                discount: item.discount,
                                code: item.code,
                                image_url: item.image_url,
                                position: i + 1
                            }]);
                            
                        if (error) throw error;
                    }
                    showToast("Successfully imported default gear! ☕");
                    loadLinks();
                }
            } catch (err) {
                console.error("Failed to import defaults:", err);
                showToast("Failed to import defaults: " + err.message);
            } finally {
                setOperationLoading(false);
            }
        });
    }

    // --- Form Handlers ---
    
    // Toggle Form visibility
    newItemBtn.addEventListener('click', () => {
        isEditMode = false;
        formHeaderTitle.textContent = "Add New Gear";
        itemForm.reset();
        inputId.value = "";
        inputPosition.value = "";
        previewImg.style.display = 'none';
        itemForm.style.display = 'flex';
        itemForm.scrollIntoView({ behavior: 'smooth' });
    });

    cancelFormBtn.addEventListener('click', () => {
        itemForm.reset();
        itemForm.style.display = 'none';
    });

    // Image preview helper
    inputImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form Submission
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = inputTitle.value.trim();
        const url = inputUrl.value.trim();
        const price = inputPrice.value.trim();
        const discount = inputDiscount.value.trim();
        const code = inputCode.value.trim();
        const imageFile = inputImage.files[0];
        const id = inputId.value;
        const position = inputPosition.value ? parseInt(inputPosition.value) : null;

        if (!title || !url) {
            showToast("Title and URL are required!");
            return;
        }

        setOperationLoading(true, isEditMode ? "Updating product..." : "Adding product...");

        try {
            let imageUrl = previewImg.src;

            // Handle image upload
            if (imageFile) {
                if (isSupabaseConfigured) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `public/${fileName}`;

                    // Upload file to Supabase Storage
                    const { error: uploadError, data } = await supabaseClient.storage
                        .from('gear-images')
                        .upload(filePath, imageFile, { upsert: true });

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('gear-images')
                        .getPublicUrl(filePath);

                    imageUrl = publicUrl;
                } else {
                    // Local Storage demo mode (file to base64)
                    imageUrl = await fileToBase64(imageFile);
                }
            } else if (!isEditMode) {
                imageUrl = "profile_placeholder.png"; // Fallback default
            }

            if (isSupabaseConfigured) {
                if (isEditMode) {
                    // Update
                    const { error } = await supabaseClient
                        .from('links')
                        .update({ title, url, price, discount, code, image_url: imageUrl })
                        .eq('id', id);

                    if (error) throw error;
                    showToast("Product updated! ☕");
                } else {
                    // Get max position
                    const { data: maxPosData } = await supabaseClient
                        .from('links')
                        .select('position')
                        .order('position', { ascending: false })
                        .limit(1);

                    const nextPosition = maxPosData && maxPosData.length > 0 ? (maxPosData[0].position + 1) : 1;

                    // Insert
                    const { error } = await supabaseClient
                        .from('links')
                        .insert([{ title, url, price, discount, code, image_url: imageUrl, position: nextPosition }]);

                    if (error) throw error;
                    showToast("Product added! 🚀");
                }
            } else {
                // Local Fallback Storage CRUD
                if (isEditMode) {
                    const index = localLinks.findIndex(l => l.title === id); // Use title as ID in local fallback
                    if (index > -1) {
                        localLinks[index] = { title, url, price, discount, code, image_url: imageUrl, position };
                    }
                    showToast("Local Demo: Product updated! ☕");
                } else {
                    const nextPosition = localLinks.length > 0 ? Math.max(...localLinks.map(l => l.position || 0)) + 1 : 1;
                    localLinks.push({ title, url, price, discount, code, image_url: imageUrl, position: nextPosition });
                    showToast("Local Demo: Product added! 🚀");
                }
                localStorage.setItem('linktree_links', JSON.stringify(localLinks));
            }

            itemForm.reset();
            itemForm.style.display = 'none';
            loadLinks();

        } catch (err) {
            console.error("Error saving item:", err);
            showToast("Error saving: " + err.message);
        } finally {
            setOperationLoading(false);
        }
    });

    // Helper: read file as Base64 for LocalStorage
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- Load and Render Admin cards ---
    async function loadLinks() {
        cardsList.innerHTML = '<div style="text-align:center; padding: 2rem;"><span class="loader"></span> Loading products...</div>';

        let links = [];

        try {
            if (isSupabaseConfigured) {
                const { data, error } = await supabaseClient
                    .from('links')
                    .select('*')
                    .order('position', { ascending: true });

                if (error) throw error;
                links = data || [];
            } else {
                links = localLinks;
            }

            renderAdminLinks(links);

        } catch (err) {
            console.error("Failed to load links:", err);
            cardsList.innerHTML = `<div class="error-message" style="display:block;">Failed to load links: ${err.message}</div>`;
        }
    }

    function renderAdminLinks(links) {
        if (links.length === 0) {
            cardsList.innerHTML = '<div class="info-message">No gear products found. Click "+ Add New Gear" to add your first card!</div>';
            return;
        }

        cardsList.innerHTML = '';

        links.forEach((item, index) => {
            const itemId = isSupabaseConfigured ? item.id : item.title; // fall back identifier
            
            const cardElement = document.createElement('div');
            cardElement.className = 'admin-card-item';

            cardElement.innerHTML = `
                <div class="admin-card-details">
                    <div class="admin-card-icon">
                        <img src="${item.image_url}" alt="${item.title}" onerror="this.src='profile_placeholder.png'">
                    </div>
                    <div class="admin-card-text">
                        <h3>${item.title}</h3>
                        <p>${item.price || 'No Price'} ${item.discount ? `• ${item.discount}` : ''} ${item.code ? `• Code: ${item.code}` : ''}</p>
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="action-icon-btn move-up" title="Move Up" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>▲</button>
                    <button class="action-icon-btn move-down" title="Move Down" ${index === links.length - 1 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>▼</button>
                    <button class="action-icon-btn edit-btn" title="Edit">✏️</button>
                    <button class="action-icon-btn delete delete-btn" title="Delete">🗑️</button>
                </div>
            `;

            // Action Listeners
            
            // Move Up
            cardElement.querySelector('.move-up').addEventListener('click', () => {
                if (index > 0) swapPositions(links, index, index - 1);
            });

            // Move Down
            cardElement.querySelector('.move-down').addEventListener('click', () => {
                if (index < links.length - 1) swapPositions(links, index, index + 1);
            });

            // Edit
            cardElement.querySelector('.edit-btn').addEventListener('click', () => {
                isEditMode = true;
                formHeaderTitle.textContent = "Edit Product";
                
                // Pre-populate form
                inputId.value = itemId;
                inputPosition.value = item.position;
                inputTitle.value = item.title;
                inputUrl.value = item.url;
                inputPrice.value = item.price || "";
                inputDiscount.value = item.discount || "";
                inputCode.value = item.code || "";
                
                previewImg.src = item.image_url;
                previewImg.style.display = 'block';
                inputImage.value = ""; // Clear file picker
                
                itemForm.style.display = 'flex';
                itemForm.scrollIntoView({ behavior: 'smooth' });
            });

            // Delete
            cardElement.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                    setOperationLoading(true, "Deleting product...");
                    try {
                        if (isSupabaseConfigured) {
                            const { error } = await supabaseClient
                                .from('links')
                                .delete()
                                .eq('id', itemId);
                            if (error) throw error;
                        } else {
                            localLinks = localLinks.filter(l => l.title !== itemId);
                            localStorage.setItem('linktree_links', JSON.stringify(localLinks));
                        }
                        showToast("Deleted product! 🗑️");
                        loadLinks();
                    } catch (err) {
                        showToast("Delete failed: " + err.message);
                    } finally {
                        setOperationLoading(false);
                    }
                }
            });

            cardsList.appendChild(cardElement);
        });
    }

    // Swapping positions for ordering
    async function swapPositions(links, idx1, idx2) {
        setOperationLoading(true, "Reordering...");

        const item1 = links[idx1];
        const item2 = links[idx2];

        const pos1 = item1.position;
        const pos2 = item2.position;

        try {
            if (isSupabaseConfigured) {
                // Swap position numbers in db
                const { error: err1 } = await supabaseClient
                    .from('links')
                    .update({ position: pos2 })
                    .eq('id', item1.id);

                if (err1) throw err1;

                const { error: err2 } = await supabaseClient
                    .from('links')
                    .update({ position: pos1 })
                    .eq('id', item2.id);

                if (err2) throw err2;
            } else {
                // Local demo swap
                item1.position = pos2;
                item2.position = pos1;
                localLinks.sort((a,b) => a.position - b.position);
                localStorage.setItem('linktree_links', JSON.stringify(localLinks));
            }
            
            showToast("Order updated! ↕️");
            loadLinks();
        } catch (err) {
            console.error("Swap failed:", err);
            showToast("Failed to reorder: " + err.message);
        } finally {
            setOperationLoading(false);
        }
    }
});
