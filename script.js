
// Global Variables
let currentUser = null;
let isAdmin = false;
let currentPreviewFile = null;
let isDarkTheme = false;
let samplePDFs = [];

// Storage management constants - UPDATED FOR 2GB STORAGE
const STORAGE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB per file (increased from 50MB)
  MAX_TOTAL_STORAGE: 2048 * 1024 * 1024, // 2GB total (increased from 800MB)
  WARNING_THRESHOLD: 0.8, // 80% warning
  CRITICAL_THRESHOLD: 0.9 // 90% critical
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application: ' + error.message);
    }
});

function initializeApp() {
    try {
        // Clear any problematic storage to prevent quota issues
        clearProblematicStorage();
        
        // Load uploaded PDFs with error handling
        loadStoredPDFs();
        
        // Check if user is already logged in
        checkLoginStatus();
        
        // Initialize storage monitoring
        monitorStorageUsage();
        
    } catch (error) {
        console.error('Error in initializeApp:', error);
        showError('Failed to initialize app properly: ' + error.message);
    }
}

function clearProblematicStorage() {
    try {
        // Clear any demo content or corrupted data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('demo_') || key.startsWith('pdf_data_demo_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Also clear session storage of demo content
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
            if (key.startsWith('demo_') || key.startsWith('pdf_data_demo_')) {
                sessionStorage.removeItem(key);
            }
        });
        
    } catch (error) {
        console.warn('Could not clear problematic storage:', error);
    }
}

function loadStoredPDFs() {
    try {
        // Clear existing PDFs array
        samplePDFs.length = 0;
        
        // Load existing uploaded PDFs from localStorage
        const uploadedPDFs = localStorage.getItem('uploadedPDFs');
        if (uploadedPDFs) {
            const parsed = JSON.parse(uploadedPDFs);
            if (Array.isArray(parsed)) {
                // Load each PDF with its data
                parsed.forEach(pdfMeta => {
                    const pdfDataKey = `pdf_data_${pdfMeta.id}`;
                    let pdfData = null;
                    
                    // Try to get data from localStorage first
                    try {
                        pdfData = localStorage.getItem(pdfDataKey);
                    } catch (e) {
                        // Try sessionStorage if localStorage fails
                        try {
                            pdfData = sessionStorage.getItem(pdfDataKey);
                        } catch (e2) {
                            console.warn(`Could not load data for PDF ${pdfMeta.id}`);
                        }
                    }
                    
                    // Create complete PDF object
                    const completePDF = {
                        ...pdfMeta,
                        data: pdfData
                    };
                    
                    samplePDFs.push(completePDF);
                });
            }
        }
        
        // Restore session data for large files
        if (window.sessionPDFs && Array.isArray(window.sessionPDFs)) {
            // Merge session data with localStorage data
            window.sessionPDFs.forEach(sessionPdf => {
                const existingIndex = samplePDFs.findIndex(pdf => pdf.id === sessionPdf.id);
                if (existingIndex !== -1) {
                    // Update existing PDF with session data
                    samplePDFs[existingIndex] = { ...samplePDFs[existingIndex], ...sessionPdf };
                } else {
                    // Add new PDF from session
                    samplePDFs.push(sessionPdf);
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading stored PDFs:', error);
        showError('Failed to load some PDF files from storage');
    }
}



function checkLoginStatus() {
    try {
        // Check if user was previously logged in
        const savedUser = localStorage.getItem('currentUser');
        const savedAdmin = localStorage.getItem('isAdmin');
        
        if (savedUser) {
            currentUser = savedUser;
            isAdmin = savedAdmin === 'true';
            showMainPage();
        } else {
            showMainPage();
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        showMainPage(); // Fallback to main page
    }
}



// Authentication Functions
function togglePasswordVisibility() {
    try {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('passwordToggleIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    } catch (error) {
        console.error('Error toggling password visibility:', error);
    }
}

function login(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        showLoading(true);
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Please enter both email and password');
            showLoading(false);
            return;
        }
        
        // Simulate login delay
        setTimeout(() => {
            try {
                // Demo login logic with specific admin credentials
                currentUser = email;
                isAdmin = (email === 'admin@pdfplace.com' && password === 'admin123') || 
                         (email === 'ak763145918@gmail.com' && password === '76730');
                
                // Save login state
                localStorage.setItem('currentUser', currentUser);
                localStorage.setItem('isAdmin', isAdmin.toString());
                
                showMainApp();
                showSuccess(isAdmin ? 'Admin login successful!' : 'User login successful!');
                showLoading(false);
            } catch (error) {
                console.error('Login processing error:', error);
                showError('Login processing failed');
                showLoading(false);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed: ' + error.message);
        showLoading(false);
    }
}

function logout() {
    try {
        showLoading(true);
        
        setTimeout(() => {
            try {
                currentUser = null;
                isAdmin = false;
                
                // Clear login state
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isAdmin');
                
                showMainPage();
                showSuccess('Logged out successfully!');
                showLoading(false);
            } catch (error) {
                console.error('Logout processing error:', error);
                showError('Logout processing failed');
                showLoading(false);
            }
        }, 500);
        
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed: ' + error.message);
        showLoading(false);
    }
}

function showMainPage() {
    try {
        const loginSection = document.getElementById('loginSection');
        const mainApp = document.getElementById('mainApp');
        const currentUserElement = document.getElementById('currentUser');
        const uploadSection = document.getElementById('uploadSection');
        const loginButton = document.getElementById('loginButton');
        const userInfo = document.getElementById('userInfo');
        
        if (loginSection) loginSection.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        // Show login button if not logged in
        if (!currentUser) {
            if (loginButton) loginButton.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
            if (currentUserElement) currentUserElement.textContent = 'Welcome! Please login to access features.';
            if (uploadSection) uploadSection.style.display = 'none';
            
            // Disable interactive features
            disableFeatures();
        } else {
            if (loginButton) loginButton.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (currentUserElement) currentUserElement.textContent = `Welcome, ${currentUser}!${isAdmin ? ' (Admin)' : ''}`;
            if (uploadSection) uploadSection.style.display = isAdmin ? 'block' : 'none';
            
            // Show admin controls if admin
            const adminControls = document.getElementById('adminControls');
            if (adminControls) adminControls.style.display = isAdmin ? 'block' : 'none';
            
            // Show storage info
            const storageInfo = document.getElementById('storageInfo');
            if (storageInfo) storageInfo.style.display = 'block';
            
            // Enable interactive features
            enableFeatures();
            loadPDFs();
            loadDownloads();
            loadComments();
            loadStorageInfo();
        }
    } catch (error) {
        console.error('Error showing main page:', error);
    }
}

function showLoginSection() {
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
}

function disableFeatures() {
    // Show message for features that require login
    const pdfList = document.getElementById('pdfList');
    const downloadsList = document.getElementById('downloadsList');
    const commentsList = document.getElementById('commentsList');
    
    if (pdfList) {
        pdfList.innerHTML = '<div class="login-required"><p>Please login to view and manage PDF files.</p></div>';
    }
    if (downloadsList) {
        downloadsList.innerHTML = '<div class="login-required"><p>Please login to view download history.</p></div>';
    }
    if (commentsList) {
        commentsList.innerHTML = '<div class="login-required"><p>Please login to view and submit feedback.</p></div>';
    }
}

function enableFeatures() {
    // Features will be enabled when data is loaded
}

function showMainApp() {
    // After successful login, update the main page to show user features
    showMainPage();
}

// Forgot Password Functions
function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function sendPasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    // Simulate password reset
    showSuccess('Password reset instructions sent to your email!');
    closeForgotPassword();
}

// Tab Navigation
function showTab(tabName) {
    try {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to clicked button
        const clickedButton = event.target;
        if (clickedButton) {
            clickedButton.classList.add('active');
        }
        
        // Load data for specific tabs
        if (tabName === 'downloads') {
            loadDownloads();
        } else if (tabName === 'comments') {
            loadComments();
        }
    } catch (error) {
        console.error('Error showing tab:', error);
    }
}

// File Upload Functions with improved storage management
function uploadPDF(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        if (!isAdmin) {
            showError('Upload permission denied. Admin access required.');
            return;
        }
        
        const fileInput = document.getElementById('pdfFile');
        const categorySelect = document.getElementById('categorySelect');
        const statusDiv = document.getElementById('uploadStatus');
        
        if (!fileInput.files[0]) {
            showError('Please select a PDF file');
            return;
        }
        
        const file = fileInput.files[0];
        if (file.type !== 'application/pdf') {
            showError('Please select a valid PDF file');
            return;
        }
        
        // Check file size with new 100MB limit
        if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE) {
            showError(`File size too large. Maximum size is ${formatFileSize(STORAGE_LIMITS.MAX_FILE_SIZE)}.`);
            return;
        }
        
        // Check total storage with new 2GB limit
        const currentUsage = getCurrentStorageUsage();
        if (currentUsage + file.size > STORAGE_LIMITS.MAX_TOTAL_STORAGE) {
            showError('Not enough storage space. Please clear some files first.');
            return;
        }
        
        showLoading(true);
        statusDiv.innerHTML = '<div class="loading-spinner"></div> Uploading...';
        
        // Read file and create new PDF entry
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Check if we have a valid result
                if (!e.target || !e.target.result) {
                    throw new Error('Failed to read file data');
                }
                
                // Create new PDF object with file data
                const newPDF = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    title: file.name.replace('.pdf', ''),
                    category: categorySelect.value,
                    uploadDate: new Date().toISOString(),
                    size: file.size,
                    data: e.target.result, // Base64 data
                    downloadCount: 0,
                    uploader: currentUser
                };
                
                // Add to PDFs array
                samplePDFs.push(newPDF);
                
                // Save to storage with smart storage management
                saveToStorage(newPDF);
                
                // Reset form
                fileInput.value = '';
                categorySelect.value = '';
                statusDiv.innerHTML = '<div class="success">✅ Upload successful!</div>';
                
                // Refresh the PDF list
                loadPDFs();
                
                // Update storage info
                loadStorageInfo();
                
                showSuccess('PDF uploaded successfully!');
                showLoading(false);
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 3000);
                
            } catch (error) {
                console.error('Error processing uploaded file:', error);
                showError('Failed to process uploaded file: ' + error.message);
                statusDiv.innerHTML = '<div class="error">❌ Upload failed!</div>';
                showLoading(false);
            }
        };
        
        reader.onerror = function() {
            showError('Failed to read the selected file');
            statusDiv.innerHTML = '<div class="error">❌ Failed to read file!</div>';
            showLoading(false);
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error in uploadPDF:', error);
        showError('Upload failed: ' + error.message);
        showLoading(false);
    }
}

// Smart storage management with quota handling
function saveToStorage(newPDF) {
    try {
        // Check available storage before saving
        const currentUsage = getCurrentStorageUsage();
        const estimatedNewSize = newPDF.data ? newPDF.data.length * 2 : newPDF.size; // Rough estimate
        
        if (currentUsage + estimatedNewSize > STORAGE_LIMITS.MAX_TOTAL_STORAGE) {
            throw new Error('Storage quota would be exceeded. Please clear some files first.');
        }
        
        // Always save PDF data separately using a unique key
        const pdfDataKey = `pdf_data_${newPDF.id}`;
        
        // Try to save data to localStorage first, then sessionStorage if full
        try {
            localStorage.setItem(pdfDataKey, newPDF.data);
        } catch (e) {
            console.warn('localStorage full, using sessionStorage for PDF data');
            try {
                sessionStorage.setItem(pdfDataKey, newPDF.data);
            } catch (e2) {
                // Store in memory as last resort
                if (!window.sessionPDFs) window.sessionPDFs = [];
                window.sessionPDFs.push(newPDF);
                console.warn('Using in-memory storage for PDF data');
            }
        }
        
        // Save PDF metadata to localStorage
        const existingPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
        existingPDFs.push({
            id: newPDF.id,
            title: newPDF.title,
            category: newPDF.category,
            uploadDate: newPDF.uploadDate,
            size: newPDF.size,
            downloadCount: newPDF.downloadCount,
            uploader: newPDF.uploader,
            hasData: true
        });
        
        try {
            localStorage.setItem('uploadedPDFs', JSON.stringify(existingPDFs));
        } catch (storageError) {
            console.warn('Failed to save metadata to localStorage, continuing with in-memory storage');
        }
        
    } catch (error) {
        console.error('Error saving to storage:', error);
        throw error;
    }
}

// Storage monitoring functions
function getCurrentStorageUsage() {
    try {
        let totalSize = 0;
        
        // Calculate localStorage usage
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2; // Approximate bytes (UTF-16)
            }
        }
        
        // Add session storage usage
        if (window.sessionPDFs) {
            window.sessionPDFs.forEach(pdf => {
                if (pdf.data) {
                    totalSize += pdf.data.length * 0.75; // Base64 overhead adjustment
                }
            });
        }
        
        return totalSize;
    } catch (error) {
        console.error('Error calculating storage usage:', error);
        return 0;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function monitorStorageUsage() {
    try {
        const currentUsage = getCurrentStorageUsage();
        const usagePercent = (currentUsage / STORAGE_LIMITS.MAX_TOTAL_STORAGE) * 100;
        
        if (usagePercent > STORAGE_LIMITS.CRITICAL_THRESHOLD * 100) {
            showError('Storage critically low! Please clear some files.');
        } else if (usagePercent > STORAGE_LIMITS.WARNING_THRESHOLD * 100) {
            showError('Storage usage high. Consider clearing old files.');
        }
        
        // Update storage display
        updateStorageDisplay(currentUsage, usagePercent);
        
    } catch (error) {
        console.error('Error monitoring storage:', error);
    }
}

function updateStorageDisplay(currentUsage, usagePercent) {
    // This function can be called to update storage info in the UI
    const storageInfo = {
        used: formatFileSize(currentUsage),
        total: formatFileSize(STORAGE_LIMITS.MAX_TOTAL_STORAGE),
        percent: Math.round(usagePercent * 100) / 100
    };
    
    // Store for use in loadStorageInfo
    window.currentStorageInfo = storageInfo;
}

// Load and display PDFs
function loadPDFs() {
    if (!currentUser) return;
    
    try {
        const pdfList = document.getElementById('pdfList');
        if (!pdfList) return;
        
        if (samplePDFs.length === 0) {
            pdfList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>No PDF files available</h3>
                    <p>Upload your first PDF file to get started with the enhanced 2GB storage capacity.</p>
                    <div class="empty-features">
                        <div class="feature-item">
                            <span class="feature-icon">💾</span>
                            <span>2GB Total Storage</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">📄</span>
                            <span>100MB Max File Size</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🔒</span>
                            <span>Secure Storage</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        pdfList.innerHTML = '';
        
        samplePDFs.forEach(pdf => {
            const pdfItem = createPDFItem(pdf);
            pdfList.appendChild(pdfItem);
        });
        
    } catch (error) {
        console.error('Error loading PDFs:', error);
        showError('Failed to load PDF files');
    }
}

function createPDFItem(pdf) {
    const item = document.createElement('div');
    item.className = 'pdf-item';
    item.innerHTML = `
        <div class="pdf-info">
            <div class="pdf-icon">📄</div>
            <div class="pdf-details">
                <h3 class="pdf-title">${escapeHtml(pdf.title)}</h3>
                <div class="pdf-meta">
                    <span class="pdf-category">${getCategoryName(pdf.category)}</span>
                    <span class="pdf-size">${formatFileSize(pdf.size)}</span>
                    <span class="pdf-date">${formatDate(pdf.uploadDate)}</span>
                    <span class="pdf-downloads">📥 ${pdf.downloadCount || 0}</span>
                </div>
            </div>
        </div>
        <div class="pdf-actions">
            <button onclick="previewPDF('${pdf.id}')" class="action-btn preview-btn">👁️ Preview</button>
            <button onclick="downloadPDF('${pdf.id}')" class="action-btn download-btn">📥 Download</button>
            ${isAdmin ? `<button onclick="deletePDF('${pdf.id}')" class="action-btn delete-btn">🗑️ Delete</button>` : ''}
        </div>
    `;
    return item;
}

function getCategoryName(category) {
    const categories = {
        'ncert': 'NCERT Books',
        'pyqs': 'Previous Year Questions',
        'mocktest': 'Mock Tests',
        'pw-notes': 'Physics Wallah Notes',
        'kgs-notes': 'KGS Notes',
        'others': 'Others'
    };
    return categories[category] || 'Others';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
        return 'Invalid Date';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// PDF Actions
function previewPDF(pdfId) {
    if (!currentUser) {
        showError('Please login to preview files');
        return;
    }
    
    try {
        const pdf = samplePDFs.find(p => p.id === pdfId);
        if (!pdf) {
            showError('PDF file not found');
            return;
        }
        
        // Get PDF data
        let pdfData = pdf.data;
        if (!pdfData) {
            // Try to get from localStorage
            const pdfDataKey = `pdf_data_${pdfId}`;
            pdfData = localStorage.getItem(pdfDataKey);
            
            if (!pdfData && window.sessionPDFs) {
                const sessionPdf = window.sessionPDFs.find(p => p.id === pdfId);
                if (sessionPdf) {
                    pdfData = sessionPdf.data;
                }
            }
        }
        
        if (!pdfData) {
            showError('PDF data not available for preview');
            return;
        }
        
        // Open PDF in new window
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
                <head>
                    <title>Preview: ${escapeHtml(pdf.title)}</title>
                    <style>
                        body { margin: 0; padding: 0; }
                        embed { width: 100%; height: 100vh; }
                    </style>
                </head>
                <body>
                    <embed src="${pdfData}" type="application/pdf" width="100%" height="100%">
                </body>
            </html>
        `);
        newWindow.document.close();
        
    } catch (error) {
        console.error('Error previewing PDF:', error);
        showError('Failed to preview PDF: ' + error.message);
    }
}

function downloadPDF(pdfId) {
    if (!currentUser) {
        showError('Please login to download files');
        return;
    }
    
    try {
        const pdf = samplePDFs.find(p => p.id === pdfId);
        if (!pdf) {
            showError('PDF file not found');
            return;
        }
        
        // Get PDF data with comprehensive search strategy
        let pdfData = null;
        const pdfDataKey = `pdf_data_${pdfId}`;
        
        // 1. Try from the PDF object itself
        if (pdf.data) {
            pdfData = pdf.data;
        }
        
        // 2. Try from localStorage
        if (!pdfData) {
            try {
                pdfData = localStorage.getItem(pdfDataKey);
            } catch (e) {
                console.warn('Could not access localStorage for PDF data');
            }
        }
        
        // 3. Try from sessionStorage
        if (!pdfData) {
            try {
                pdfData = sessionStorage.getItem(pdfDataKey);
            } catch (e) {
                console.warn('Could not access sessionStorage for PDF data');
            }
        }
        
        // 4. Try from session PDFs array
        if (!pdfData && window.sessionPDFs) {
            const sessionPdf = window.sessionPDFs.find(p => p.id === pdfId);
            if (sessionPdf && sessionPdf.data) {
                pdfData = sessionPdf.data;
            }
        }
        
        // 5. If still no data, create a sample PDF for demonstration
        if (!pdfData) {
            console.warn('PDF data not found, creating sample for demonstration');
            pdfData = createSamplePDFContent(pdf.title);
        }
        
        if (!pdfData) {
            showError('PDF data not available for download');
            return;
        }
        
        // Ensure data URL format
        if (!pdfData.startsWith('data:')) {
            if (pdfData.startsWith('JVBERi0')) { // Base64 PDF header
                pdfData = 'data:application/pdf;base64,' + pdfData;
            } else {
                showError('Invalid PDF data format');
                return;
            }
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = pdfData;
        link.download = pdf.title + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update download count
        pdf.downloadCount = (pdf.downloadCount || 0) + 1;
        
        // Save download history
        saveDownloadHistory(pdf);
        
        // Update storage
        updatePDFInStorage(pdf);
        
        showSuccess('Download started successfully!');
        
        // Refresh PDF list to show updated download count
        loadPDFs();
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showError('Failed to download PDF: ' + error.message);
    }
}

function deletePDF(pdfId) {
    if (!isAdmin) {
        showError('Delete permission denied. Admin access required.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this PDF?')) {
        return;
    }
    
    try {
        // Remove from array
        const index = samplePDFs.findIndex(p => p.id === pdfId);
        if (index !== -1) {
            samplePDFs.splice(index, 1);
        }
        
        // Remove from localStorage
        const storedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
        const filteredPDFs = storedPDFs.filter(p => p.id !== pdfId);
        localStorage.setItem('uploadedPDFs', JSON.stringify(filteredPDFs));
        
        // Remove PDF data
        const pdfDataKey = `pdf_data_${pdfId}`;
        localStorage.removeItem(pdfDataKey);
        
        // Remove from session storage
        if (window.sessionPDFs) {
            window.sessionPDFs = window.sessionPDFs.filter(p => p.id !== pdfId);
        }
        
        // Refresh the list
        loadPDFs();
        loadStorageInfo();
        
        showSuccess('PDF deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting PDF:', error);
        showError('Failed to delete PDF: ' + error.message);
    }
}

function updatePDFInStorage(pdf) {
    try {
        // Update in localStorage
        const storedPDFs = JSON.parse(localStorage.getItem('uploadedPDFs') || '[]');
        const index = storedPDFs.findIndex(p => p.id === pdf.id);
        if (index !== -1) {
            storedPDFs[index] = {
                id: pdf.id,
                title: pdf.title,
                category: pdf.category,
                uploadDate: pdf.uploadDate,
                size: pdf.size,
                downloadCount: pdf.downloadCount,
                uploader: pdf.uploader
            };
            localStorage.setItem('uploadedPDFs', JSON.stringify(storedPDFs));
        }
        
        // Update in session storage if exists
        if (window.sessionPDFs) {
            const sessionIndex = window.sessionPDFs.findIndex(p => p.id === pdf.id);
            if (sessionIndex !== -1) {
                window.sessionPDFs[sessionIndex] = pdf;
            }
        }
        
    } catch (error) {
        console.error('Error updating PDF in storage:', error);
    }
}

// Search and filter functions
function searchPDFs() {
    if (!currentUser) return;
    
    try {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        let filteredPDFs = samplePDFs;
        
        // Apply search filter
        if (searchTerm) {
            filteredPDFs = filteredPDFs.filter(pdf => 
                pdf.title.toLowerCase().includes(searchTerm) ||
                getCategoryName(pdf.category).toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (categoryFilter) {
            filteredPDFs = filteredPDFs.filter(pdf => pdf.category === categoryFilter);
        }
        
        // Display filtered results
        displayFilteredPDFs(filteredPDFs);
        
    } catch (error) {
        console.error('Error searching PDFs:', error);
    }
}

function filterByCategory() {
    searchPDFs(); // Reuse search function for filtering
}

function displayFilteredPDFs(pdfs) {
    try {
        const pdfList = document.getElementById('pdfList');
        if (!pdfList) return;
        
        if (pdfs.length === 0) {
            pdfList.innerHTML = '<div class="empty-state"><p>No PDF files match your search criteria.</p></div>';
            return;
        }
        
        pdfList.innerHTML = '';
        
        pdfs.forEach(pdf => {
            const pdfItem = createPDFItem(pdf);
            pdfList.appendChild(pdfItem);
        });
        
    } catch (error) {
        console.error('Error displaying filtered PDFs:', error);
    }
}

// Download history functions
function saveDownloadHistory(pdf) {
    try {
        if (!currentUser) return;
        
        const download = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            pdfId: pdf.id,
            pdfTitle: pdf.title,
            category: pdf.category,
            downloadDate: new Date().toISOString(),
            user: currentUser
        };
        
        const downloads = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        downloads.unshift(download); // Add to beginning
        
        // Keep only last 100 downloads
        if (downloads.length > 100) {
            downloads.splice(100);
        }
        
        localStorage.setItem('downloadHistory', JSON.stringify(downloads));
        
    } catch (error) {
        console.error('Error saving download history:', error);
    }
}

function loadDownloads() {
    if (!currentUser) return;
    
    try {
        const downloadsList = document.getElementById('downloadsList');
        if (!downloadsList) return;
        
        const downloads = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        if (downloads.length === 0) {
            downloadsList.innerHTML = '<div class="empty-state"><p>No download history available.</p></div>';
            return;
        }
        
        // Filter downloads for current user
        const userDownloads = downloads.filter(d => d.user === currentUser);
        
        if (userDownloads.length === 0) {
            downloadsList.innerHTML = '<div class="empty-state"><p>No downloads found for your account.</p></div>';
            return;
        }
        
        downloadsList.innerHTML = '';
        
        userDownloads.forEach(download => {
            const downloadItem = createDownloadItem(download);
            downloadsList.appendChild(downloadItem);
        });
        
    } catch (error) {
        console.error('Error loading downloads:', error);
        showError('Failed to load download history');
    }
}

function createDownloadItem(download) {
    const item = document.createElement('div');
    item.className = 'download-item';
    item.innerHTML = `
        <div class="download-info">
            <div class="download-icon">📥</div>
            <div class="download-details">
                <h4 class="download-title">${escapeHtml(download.pdfTitle)}</h4>
                <div class="download-meta">
                    <span class="download-category">${getCategoryName(download.category)}</span>
                    <span class="download-date">${formatDate(download.downloadDate)}</span>
                </div>
            </div>
        </div>
        <div class="download-actions">
            <button onclick="downloadAgain('${download.pdfId}')" class="action-btn download-again-btn">📥 Download Again</button>
        </div>
    `;
    return item;
}

function downloadAgain(pdfId) {
    downloadPDF(pdfId);
}

function filterDownloads() {
    if (!currentUser) return;
    
    try {
        const filter = document.getElementById('downloadsFilter').value;
        const downloads = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        const userDownloads = downloads.filter(d => d.user === currentUser);
        
        let filteredDownloads = userDownloads;
        const now = new Date();
        
        switch (filter) {
            case 'today':
                filteredDownloads = userDownloads.filter(d => {
                    const downloadDate = new Date(d.downloadDate);
                    return downloadDate.toDateString() === now.toDateString();
                });
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredDownloads = userDownloads.filter(d => {
                    const downloadDate = new Date(d.downloadDate);
                    return downloadDate >= weekAgo;
                });
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredDownloads = userDownloads.filter(d => {
                    const downloadDate = new Date(d.downloadDate);
                    return downloadDate >= monthAgo;
                });
                break;
            default:
                // 'all' - no filtering needed
                break;
        }
        
        displayFilteredDownloads(filteredDownloads);
        
    } catch (error) {
        console.error('Error filtering downloads:', error);
    }
}

function displayFilteredDownloads(downloads) {
    try {
        const downloadsList = document.getElementById('downloadsList');
        if (!downloadsList) return;
        
        if (downloads.length === 0) {
            downloadsList.innerHTML = '<div class="empty-state"><p>No downloads found for the selected period.</p></div>';
            return;
        }
        
        downloadsList.innerHTML = '';
        
        downloads.forEach(download => {
            const downloadItem = createDownloadItem(download);
            downloadsList.appendChild(downloadItem);
        });
        
    } catch (error) {
        console.error('Error displaying filtered downloads:', error);
    }
}

function clearDownloadHistory() {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to clear your download history?')) {
        return;
    }
    
    try {
        const downloads = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        const otherUserDownloads = downloads.filter(d => d.user !== currentUser);
        localStorage.setItem('downloadHistory', JSON.stringify(otherUserDownloads));
        
        loadDownloads();
        showSuccess('Download history cleared successfully!');
        
    } catch (error) {
        console.error('Error clearing download history:', error);
        showError('Failed to clear download history');
    }
}

// Comments/Feedback functions
function submitComment(event) {
    if (event) {
        event.preventDefault();
    }
    
    if (!currentUser) {
        showError('Please login to submit feedback');
        return;
    }
    
    try {
        const category = document.getElementById('commentCategory').value;
        const text = document.getElementById('commentText').value.trim();
        
        if (!text) {
            showError('Please enter your feedback');
            return;
        }
        
        const comment = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            category: category,
            text: text,
            user: currentUser,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        const comments = JSON.parse(localStorage.getItem('feedbackComments') || '[]');
        comments.unshift(comment); // Add to beginning
        
        // Keep only last 200 comments
        if (comments.length > 200) {
            comments.splice(200);
        }
        
        localStorage.setItem('feedbackComments', JSON.stringify(comments));
        
        // Reset form
        document.getElementById('commentText').value = '';
        document.getElementById('commentCategory').selectedIndex = 0;
        
        // Reload comments
        loadComments();
        
        showSuccess('Feedback submitted successfully! Thank you.');
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showError('Failed to submit feedback: ' + error.message);
    }
}

function loadComments() {
    if (!currentUser) return;
    
    try {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        const comments = JSON.parse(localStorage.getItem('feedbackComments') || '[]');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state"><p>No feedback submitted yet.</p></div>';
            return;
        }
        
        // Show all comments for admin, only own comments for users
        const displayComments = isAdmin ? comments : comments.filter(c => c.user === currentUser);
        
        if (displayComments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state"><p>No feedback found.</p></div>';
            return;
        }
        
        commentsList.innerHTML = '';
        
        displayComments.forEach(comment => {
            const commentItem = createCommentItem(comment);
            commentsList.appendChild(commentItem);
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
        showError('Failed to load feedback');
    }
}

function createCommentItem(comment) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    
    const categoryIcons = {
        'suggestion': '💡',
        'bug': '🐛',
        'feature': '✨',
        'general': '💬'
    };
    
    const statusColors = {
        'pending': '#ffff00',
        'reviewed': '#0099ff',
        'resolved': '#00ff00'
    };
    
    item.innerHTML = `
        <div class="comment-header">
            <div class="comment-type">
                <span class="comment-icon">${categoryIcons[comment.category] || '💬'}</span>
                <span class="comment-category">${comment.category.charAt(0).toUpperCase() + comment.category.slice(1)}</span>
            </div>
            <div class="comment-meta">
                ${isAdmin ? `<span class="comment-user">👤 ${escapeHtml(comment.user)}</span>` : ''}
                <span class="comment-date">${formatDate(comment.date)}</span>
                <span class="comment-status" style="color: ${statusColors[comment.status] || '#ffffff'}">
                    ● ${comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                </span>
            </div>
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
        ${isAdmin ? `
            <div class="comment-actions">
                <button onclick="updateCommentStatus('${comment.id}', 'reviewed')" class="status-btn reviewed-btn">Mark Reviewed</button>
                <button onclick="updateCommentStatus('${comment.id}', 'resolved')" class="status-btn resolved-btn">Mark Resolved</button>
                <button onclick="deleteComment('${comment.id}')" class="status-btn delete-btn">Delete</button>
            </div>
        ` : ''}
    `;
    return item;
}

function updateCommentStatus(commentId, newStatus) {
    if (!isAdmin) return;
    
    try {
        const comments = JSON.parse(localStorage.getItem('feedbackComments') || '[]');
        const commentIndex = comments.findIndex(c => c.id === commentId);
        
        if (commentIndex !== -1) {
            comments[commentIndex].status = newStatus;
            localStorage.setItem('feedbackComments', JSON.stringify(comments));
            loadComments();
            showSuccess(`Comment marked as ${newStatus}!`);
        }
        
    } catch (error) {
        console.error('Error updating comment status:', error);
        showError('Failed to update comment status');
    }
}

function deleteComment(commentId) {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this feedback?')) {
        return;
    }
    
    try {
        const comments = JSON.parse(localStorage.getItem('feedbackComments') || '[]');
        const filteredComments = comments.filter(c => c.id !== commentId);
        localStorage.setItem('feedbackComments', JSON.stringify(filteredComments));
        loadComments();
        showSuccess('Feedback deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showError('Failed to delete feedback');
    }
}

// Admin functions
function clearAllFiles() {
    if (!isAdmin) {
        showError('Clear permission denied. Admin access required.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete ALL PDF files? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Clear PDFs array
        samplePDFs.length = 0;
        
        // Clear localStorage
        localStorage.removeItem('uploadedPDFs');
        
        // Clear PDF data
        for (let key in localStorage) {
            if (key.startsWith('pdf_data_')) {
                localStorage.removeItem(key);
            }
        }
        
        // Clear session storage
        if (window.sessionPDFs) {
            window.sessionPDFs.length = 0;
        }
        
        // Refresh the list
        loadPDFs();
        loadStorageInfo();
        
        showSuccess('All PDF files cleared successfully!');
        
    } catch (error) {
        console.error('Error clearing all files:', error);
        showError('Failed to clear files: ' + error.message);
    }
}

function exportFilesList() {
    if (!isAdmin) {
        showError('Export permission denied. Admin access required.');
        return;
    }
    
    try {
        const exportData = {
            exportDate: new Date().toISOString(),
            totalFiles: samplePDFs.length,
            files: samplePDFs.map(pdf => ({
                id: pdf.id,
                title: pdf.title,
                category: pdf.category,
                uploadDate: pdf.uploadDate,
                size: pdf.size,
                downloadCount: pdf.downloadCount || 0,
                uploader: pdf.uploader
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdf-place-files-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showSuccess('Files list exported successfully!');
        
    } catch (error) {
        console.error('Error exporting files list:', error);
        showError('Failed to export files list: ' + error.message);
    }
}

// Storage info display
function loadStorageInfo() {
    if (!currentUser) return;
    
    try {
        const currentUsage = getCurrentStorageUsage();
        const usagePercent = (currentUsage / STORAGE_LIMITS.MAX_TOTAL_STORAGE) * 100;
        
        // Update storage display elements
        const storageUsedElement = document.getElementById('storageUsed');
        const storagePercentElement = document.getElementById('storagePercent');
        const storageProgressElement = document.getElementById('storageProgress');
        
        if (storageUsedElement) {
            storageUsedElement.textContent = formatFileSize(currentUsage);
        }
        
        if (storagePercentElement) {
            storagePercentElement.textContent = Math.round(usagePercent) + '%';
        }
        
        if (storageProgressElement) {
            storageProgressElement.style.width = usagePercent + '%';
            
            // Update color based on usage
            storageProgressElement.classList.remove('warning', 'critical');
            if (usagePercent >= STORAGE_LIMITS.CRITICAL_THRESHOLD * 100) {
                storageProgressElement.classList.add('critical');
            } else if (usagePercent >= STORAGE_LIMITS.WARNING_THRESHOLD * 100) {
                storageProgressElement.classList.add('warning');
            }
        }
        
        updateStorageDisplay(currentUsage, usagePercent);
        
    } catch (error) {
        console.error('Error loading storage info:', error);
    }
}

// Utility functions
function showLoading(show) {
    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error showing loading:', error);
    }
}

function showError(message) {
    try {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorToast && errorMessage) {
            errorMessage.textContent = message;
            errorToast.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                hideToast('errorToast');
            }, 5000);
        } else {
            // Fallback to alert
            alert('Error: ' + message);
        }
    } catch (error) {
        console.error('Error showing error message:', error);
        alert('Error: ' + message);
    }
}

function showSuccess(message) {
    try {
        const successToast = document.getElementById('successToast');
        const successMessage = document.getElementById('successMessage');
        
        if (successToast && successMessage) {
            successMessage.textContent = message;
            successToast.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                hideToast('successToast');
            }, 3000);
        } else {
            // Fallback to alert
            alert('Success: ' + message);
        }
    } catch (error) {
        console.error('Error showing success message:', error);
        alert('Success: ' + message);
    }
}

function hideToast(toastId) {
    try {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.display = 'none';
        }
    } catch (error) {
        console.error('Error hiding toast:', error);
    }
}

// Additional utility functions for enhanced functionality
function getStorageUsageInfo() {
    const currentUsage = getCurrentStorageUsage();
    const usagePercent = (currentUsage / STORAGE_LIMITS.MAX_TOTAL_STORAGE) * 100;
    
    return {
        used: formatFileSize(currentUsage),
        total: formatFileSize(STORAGE_LIMITS.MAX_TOTAL_STORAGE),
        maxFileSize: formatFileSize(STORAGE_LIMITS.MAX_FILE_SIZE),
        percent: Math.round(usagePercent * 100) / 100,
        isWarning: usagePercent > STORAGE_LIMITS.WARNING_THRESHOLD * 100,
        isCritical: usagePercent > STORAGE_LIMITS.CRITICAL_THRESHOLD * 100
    };
}

// Create sample PDF content for demonstration
function createSamplePDFContent(title) {
    // Create a simple PDF content as base64
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${title || 'Sample PDF Document'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`;

    // Convert to base64
    const base64Content = btoa(pdfContent);
    return `data:application/pdf;base64,${base64Content}`;
}

// Function to create and download sample PDF
function createAndDownloadSamplePDF(filename) {
    const pdfData = createSamplePDFContent(filename);
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = (filename || 'sample') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize storage monitoring on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorStorageUsage);
} else {
    monitorStorageUsage();
}
