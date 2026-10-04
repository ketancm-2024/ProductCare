/* =========================================================
   PRODUCTCARE
   Premium Frontend JavaScript
   ========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API = "http://localhost:5000";

let currentUser = null;
let products = [];
let selectedProduct = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeAuth();
    initializeUI();
    initializeForms();
    initializeSearch();
    initializeKeyboardShortcuts();

});


/* =========================================================
   AUTH INITIALIZATION
========================================================= */

function initializeAuth() {

    const savedUser = localStorage.getItem("productcare_user");

    if (savedUser) {

        try {

            currentUser = JSON.parse(savedUser);

            if (currentUser && currentUser.id) {

                showApp();

                return;

            }

        } catch (error) {

            console.error("Saved user data is invalid.");

        }

    }

    showAuth();

}


/* =========================================================
   SHOW AUTH
========================================================= */

function showAuth() {

    $("authScreen").classList.remove("hidden");

    $("app").classList.add("hidden");

}


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    $("authScreen").classList.add("hidden");

    $("app").classList.remove("hidden");

    updateUserUI();

    loadProducts();

}


/* =========================================================
   UPDATE USER UI
========================================================= */

function updateUserUI() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUser.name ||
        currentUser.fullName ||
        currentUser.email?.split("@")[0] ||
        "User";


    if ($("navUserName")) {

        $("navUserName").textContent = name;

    }


    if ($("navAvatar")) {

        $("navAvatar").textContent =
            name.charAt(0).toUpperCase();

    }

}


/* =========================================================
   AUTH FORMS
========================================================= */

function initializeForms() {


    /* -------------------------
       SHOW SIGNUP
    ------------------------- */

    $("showSignup")?.addEventListener("click", () => {

        $("loginBox").classList.add("hidden");

        $("signupBox").classList.remove("hidden");

    });


    /* -------------------------
       SHOW LOGIN
    ------------------------- */

    $("showLogin")?.addEventListener("click", () => {

        $("signupBox").classList.add("hidden");

        $("loginBox").classList.remove("hidden");

    });


    /* -------------------------
       LOGIN
    ------------------------- */

    $("loginForm")?.addEventListener(
        "submit",
        handleLogin
    );


    /* -------------------------
       SIGNUP
    ------------------------- */

    $("signupForm")?.addEventListener(
        "submit",
        handleSignup
    );


    /* -------------------------
       LOGOUT
    ------------------------- */

    $("logoutBtn")?.addEventListener(
        "click",
        logout
    );


    /* -------------------------
       PRODUCT
    ------------------------- */

    $("productForm")?.addEventListener(
        "submit",
        handleAddProduct
    );


    /* -------------------------
       SERVICE
    ------------------------- */

    $("serviceForm")?.addEventListener(
        "submit",
        handleAddService
    );

}


/* =========================================================
   SIGNUP
========================================================= */

async function handleSignup(event) {

    event.preventDefault();


    const name =
        $("signupName").value.trim();

    const email =
        $("signupEmail").value.trim();

    const password =
        $("signupPassword").value;

    const confirmPassword =
        $("signupConfirmPassword").value;


    if (!name || !email || !password) {

        showToast(
            "Please fill all required fields.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showToast(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showToast(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    try {

        const response = await fetch(
            `${API}/api/auth/signup`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Signup failed."
            );

        }


        showToast(
            "Account created successfully.",
            "success"
        );


        $("signupForm").reset();


        $("signupBox").classList.add("hidden");

        $("loginBox").classList.remove("hidden");


        $("loginEmail").value = email;


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to create account.",
            "error"
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const email =
        $("loginEmail").value.trim();

    const password =
        $("loginPassword").value;


    if (!email || !password) {

        showToast(
            "Enter your email and password.",
            "error"
        );

        return;
    }


    try {

        const response = await fetch(
            `${API}/api/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Invalid login credentials."
            );

        }


        /*
         Backend may return:

         {
            user: {...}
         }

         or directly:

         {
            id,
            name,
            email
         }
        */

        currentUser =
            data.user ||
            data;


        if (!currentUser.id) {

            throw new Error(
                "Login response did not contain a user ID."
            );

        }


        localStorage.setItem(
            "productcare_user",
            JSON.stringify(currentUser)
        );


        $("loginForm").reset();


        showToast(
            "Welcome back to ProductCare.",
            "success"
        );


        showApp();


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to login.",
            "error"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    currentUser = null;

    products = [];

    selectedProduct = null;

    localStorage.removeItem(
        "productcare_user"
    );


    $("app").classList.add("hidden");

    $("authScreen").classList.remove("hidden");


    $("loginForm")?.reset();

    $("signupForm")?.reset();


    showToast(
        "You have been logged out.",
        "success"
    );

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    if (!currentUser || !currentUser.id) {
        return;
    }


    try {

        const response = await fetch(
            `${API}/api/products?userId=${encodeURIComponent(currentUser.id)}`
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load products."
            );

        }


        const data = await response.json();


        /*
         Supports:

         [
            product,
            product
         ]

         or

         {
            products: [...]
         }
        */

        products =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.products)
                        ? data.products
                        : []
                );


        renderProducts();

        updateDashboard();

        renderReminders();


    } catch (error) {

        console.error(error);

        products = [];

        renderProducts();

        updateDashboard();

        renderReminders();


        showToast(
            "Could not load products from the server.",
            "error"
        );

    }

}


/* =========================================================
   ADD PRODUCT
========================================================= */

async function handleAddProduct(event) {

    event.preventDefault();


    if (!currentUser || !currentUser.id) {

        showToast(
            "Please login first.",
            "error"
        );

        return;
    }


    const name =
        $("productName").value.trim();

    const brand =
        $("productBrand").value.trim();

    const category =
        $("productCategory").value;

    const purchaseDate =
        $("purchaseDate").value;

    const price =
        Number($("productPrice").value);

    const warrantyMonths =
        Number($("warrantyMonths").value);

    const serviceInterval =
        Number($("serviceInterval").value);


    if (
        !name ||
        !brand ||
        !category ||
        !purchaseDate ||
        !price ||
        !warrantyMonths
    ) {

        showToast(
            "Please complete all required product fields.",
            "error"
        );

        return;
    }


    const warrantyEnd =
        calculateFutureDate(
            purchaseDate,
            warrantyMonths
        );


    const nextService =
        serviceInterval > 0
            ? calculateFutureDate(
                purchaseDate,
                serviceInterval
            )
            : null;


    const product = {

        userId: currentUser.id,

        name,

        brand,

        category,

        purchaseDate,

        price,

        warrantyMonths,

        warrantyEnd,

        serviceInterval,

        nextService,

        serviceHistory: [],

        health: calculateProductHealth({

            purchaseDate,

            warrantyEnd,

            nextService,

            serviceHistory: []

        })

    };


    try {

        const response = await fetch(
            `${API}/api/products`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(product)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to save product."
            );

        }


        /*
         Backend may return:

         created product

         or

         {
             product: createdProduct
         }
        */

        const savedProduct =
            data.product ||
            data;


        /*
         Upload invoice if user selected one.
        */

        const invoiceFile =
            $("invoiceFile").files[0];


        if (
            invoiceFile &&
            savedProduct.id
        ) {

            await uploadInvoice(
                savedProduct.id,
                invoiceFile
            );

        }


        showToast(
            "Product passport created successfully.",
            "success"
        );


        $("productForm").reset();


        await loadProducts();


        setTimeout(() => {

            const productsSection =
                document.querySelector(
                    ".products-grid"
                );

            if (productsSection) {

                productsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }, 300);


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to add product.",
            "error"
        );

    }

}


/* =========================================================
   UPLOAD INVOICE
========================================================= */

async function uploadInvoice(
    productId,
    file
) {

    try {

        const base64 =
            await fileToBase64(file);


        const response = await fetch(
            `${API}/api/products/invoice`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    userId: currentUser.id,

                    productId,

                    fileName: file.name,

                    fileType: file.type,

                    fileData: base64

                })
            }
        );


        if (!response.ok) {

            throw new Error(
                "Invoice upload failed."
            );

        }


        return await response.json();


    } catch (error) {

        console.error(
            "Invoice upload error:",
            error
        );


        showToast(
            "Product saved, but invoice upload failed.",
            "warning"
        );

        return null;

    }

}


/* =========================================================
   FILE TO BASE64
========================================================= */

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () => {

                const result =
                    reader.result;


                /*
                 Remove:

                 data:image/png;base64,

                 or

                 data:application/pdf;base64,
                */

                const base64 =
                    String(result)
                        .split(",")[1];


                resolve(base64);

            };


            reader.onerror = reject;


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    const container =
        $("products");

    const empty =
        $("productsEmpty");


    if (!container) {
        return;
    }


    const search =
        $("productSearch")
            ?.value
            .trim()
            .toLowerCase() || "";


    const filter =
        $("productFilter")
            ?.value || "all";


    let filteredProducts =
        [...products];


    /*
     Search
    */

    if (search) {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    const text = [

                        product.name,

                        product.brand,

                        product.category

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(search);

                }
            );

    }


    /*
     Filter
    */

    if (filter === "healthy") {

        filteredProducts =
            filteredProducts.filter(
                product =>
                    getHealth(product) >= 75
            );

    }


    if (filter === "warranty") {

        filteredProducts =
            filteredProducts.filter(
                product =>
                    isWarrantyActive(product)
            );

    }


    if (filter === "service") {

        filteredProducts =
            filteredProducts.filter(
                product =>
                    isServiceDue(product)
            );

    }


    container.innerHTML = "";


    if (!filteredProducts.length) {

        container.classList.add("hidden");

        empty?.classList.remove("hidden");

        return;

    }


    container.classList.remove("hidden");

    empty?.classList.add("hidden");


    filteredProducts.forEach(
        product => {

            container.appendChild(
                createProductCard(product)
            );

        }
    );

}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(product) {

    const card =
        document.createElement("div");


    card.className =
        "product-card";


    const health =
        getHealth(product);


    const warranty =
        isWarrantyActive(product);


    const serviceDue =
        isServiceDue(product);


    const icon =
        getProductIcon(
            product.category
        );


    let status =
        "Healthy";


    if (serviceDue) {

        status =
            "Service Due";

    } else if (!warranty) {

        status =
            "Warranty Expired";

    } else if (health < 60) {

        status =
            "Needs Attention";

    }


    card.innerHTML = `

        <div class="product-card-top">

            <div class="product-icon">
                ${icon}
            </div>

            <span class="status-badge">
                ${escapeHTML(status)}
            </span>

        </div>


        <h3>
            ${escapeHTML(
                product.name || "Unnamed Product"
            )}
        </h3>


        <p class="product-brand">
            ${escapeHTML(
                product.brand || "Unknown brand"
            )}
        </p>


        <div class="product-meta">

            <div>

                <span>
                    Warranty
                </span>

                <strong>
                    ${
                        warranty
                            ? "Active"
                            : "Expired"
                    }
                </strong>

            </div>


            <div>

                <span>
                    Health
                </span>

                <strong>
                    ${health}%
                </strong>

            </div>

        </div>


        <div class="health-bar">

            <div
                class="health-fill"
                style="width:${health}%"
            ></div>

        </div>


        <div class="product-card-footer">

            <span>
                ${
                    product.purchaseDate
                        ? formatDate(
                            product.purchaseDate
                        )
                        : "No date"
                }
            </span>

            <span class="view-product">
                View passport →
            </span>

        </div>

    `;


    card.addEventListener(
        "click",
        () => showDetails(product)
    );


    return card;

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard() {

    const total =
        products.length;


    const activeWarranties =
        products.filter(
            isWarrantyActive
        ).length;


    const servicesDue =
        products.filter(
            isServiceDue
        ).length;


    const averageHealth =
        total
            ? Math.round(
                products.reduce(
                    (sum, product) =>
                        sum + getHealth(product),
                    0
                ) / total
            )
            : 0;


    $("totalProducts").textContent =
        total;


    $("activeWarranties").textContent =
        activeWarranties;


    $("servicesDue").textContent =
        servicesDue;


    $("averageHealth").textContent =
        `${averageHealth}%`;


    updateOwnershipScore(
        averageHealth,
        activeWarranties,
        servicesDue,
        total
    );


    updateOwnershipInsight(
        averageHealth,
        activeWarranties,
        servicesDue,
        total
    );

}


/* =========================================================
   OWNERSHIP SCORE
========================================================= */

function updateOwnershipScore(
    averageHealth,
    activeWarranties,
    servicesDue,
    total
) {

    if (!total) {

        setScore(0);

        return;

    }


    const warrantyScore =
        Math.round(
            (activeWarranties / total) * 100
        );


    const serviceScore =
        Math.max(
            0,
            100 - (servicesDue * 20)
        );


    const score =
        Math.round(
            (
                averageHealth * 0.5 +
                warrantyScore * 0.3 +
                serviceScore * 0.2
            )
        );


    setScore(
        Math.max(
            0,
            Math.min(100, score)
        )
    );

}


/* =========================================================
   SET SCORE UI
========================================================= */

function setScore(score) {

    if ($("ownershipScore")) {

        $("ownershipScore").textContent =
            score;

    }


    if ($("scoreText")) {

        $("scoreText").textContent =
            `${score}%`;

    }


    const circle =
        $("scoreCircle");


    if (circle) {

        const circumference =
            314;


        const offset =
            circumference -
            (
                circumference *
                score /
                100
            );


        circle.style.strokeDashoffset =
            offset;

    }

}


/* =========================================================
   OWNERSHIP INSIGHT
========================================================= */

function updateOwnershipInsight(
    averageHealth,
    activeWarranties,
    servicesDue,
    total
) {

    if (!$("ownershipInsight")) {
        return;
    }


    let message =
        "Add your first product to unlock insights.";


    if (!total) {

        message =
            "Start building your Product Passport.";

    }


    else if (servicesDue > 0) {

        message =
            `You have ${servicesDue} product${
                servicesDue > 1 ? "s" : ""
            } that need service attention.`;

    }


    else if (averageHealth >= 85) {

        message =
            "Excellent. Your product portfolio is well maintained.";

    }


    else if (activeWarranties === total) {

        message =
            "Great coverage. All your registered products are currently under warranty.";

    }


    else if (averageHealth >= 65) {

        message =
            "Your products are mostly healthy, but a few need closer attention.";

    }


    else {

        message =
            "Some products may need maintenance or replacement planning.";

    }


    $("ownershipInsight").textContent =
        message;

}


/* =========================================================
   REMINDERS
========================================================= */

function renderReminders() {

    const container =
        $("reminders");


    const badge =
        $("reminderCount");


    if (!container) {
        return;
    }


    const reminders = [];


    products.forEach(product => {


        /*
         Warranty expiring within 30 days
        */

        if (product.warrantyEnd) {

            const days =
                daysUntil(
                    product.warrantyEnd
                );


            if (
                days >= 0 &&
                days <= 30
            ) {

                reminders.push({

                    type: "Warranty",

                    product,

                    message:
                        days === 0
                            ? "Warranty expires today."
                            : `Warranty expires in ${days} day${
                                days === 1
                                    ? ""
                                    : "s"
                            }.`

                });

            }

        }


        /*
         Service due
        */

        if (product.nextService) {

            const days =
                daysUntil(
                    product.nextService
                );


            if (
                days >= 0 &&
                days <= 30
            ) {

                reminders.push({

                    type: "Service",

                    product,

                    message:
                        days === 0
                            ? "Service is due today."
                            : `Service is due in ${days} day${
                                days === 1
                                    ? ""
                                    : "s"
                            }.`

                });

            }

        }

    });


    badge.textContent =
        reminders.length;


    if (!reminders.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    You're all caught up
                </h3>

                <p>
                    ProductCare will surface important
                    warranty and service reminders here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    reminders
        .slice(0, 6)
        .forEach(reminder => {

            const card =
                document.createElement("div");


            card.className =
                "reminder-card";


            card.innerHTML = `

                <div class="reminder-top">

                    <div class="reminder-icon">
                        ${
                            reminder.type === "Warranty"
                                ? "◈"
                                : "◷"
                        }
                    </div>

                    <span class="status-badge">
                        ${reminder.type}
                    </span>

                </div>


                <h3>
                    ${escapeHTML(
                        reminder.product.name ||
                        "Product"
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        reminder.message
                    )}
                </p>


                <div class="reminder-date">

                    ${
                        reminder.type === "Warranty"
                            ? formatDate(
                                reminder.product.warrantyEnd
                            )
                            : formatDate(
                                reminder.product.nextService
                            )
                    }

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    showDetails(
                        reminder.product
                    )
            );


            container.appendChild(card);

        });

}


/* =========================================================
   SEARCH / FILTER
========================================================= */

function initializeSearch() {

    $("productSearch")?.addEventListener(
        "input",
        renderProducts
    );


    $("productFilter")?.addEventListener(
        "change",
        renderProducts
    );

}


/* =========================================================
   PRODUCT DETAILS
========================================================= */

function showDetails(product) {

    selectedProduct =
        product;


    const modal =
        $("detailsBox");


    if (!modal) {
        return;
    }


    const health =
        getHealth(product);


    const warranty =
        isWarrantyActive(product);


    $("detailIcon").textContent =
        getProductIcon(
            product.category
        );


    $("detailName").textContent =
        product.name ||
        "Product";


    $("detailBrand").textContent =
        product.brand ||
        "Unknown brand";


    $("detailCategory").textContent =
        product.category ||
        "PRODUCT";


    $("detailPrice").textContent =
        formatCurrency(
            product.price
        );


    $("detailWarranty").textContent =
        product.warrantyEnd
            ? (
                warranty
                    ? `Active until ${formatDate(product.warrantyEnd)}`
                    : `Expired ${formatDate(product.warrantyEnd)}`
            )
            : "Not specified";


    $("detailService").textContent =
        product.nextService
            ? formatDate(
                product.nextService
            )
            : "Not scheduled";


    $("detailHealth").textContent =
        `${health}%`;


    const badge =
        $("detailHealthBadge");


    if (badge) {

        badge.textContent =
            getHealthLabel(health);


        badge.style.background =
            health >= 75
                ? "var(--green-soft)"
                : health >= 50
                    ? "var(--orange-soft)"
                    : "var(--red-soft)";


        badge.style.color =
            health >= 75
                ? "var(--green)"
                : health >= 50
                    ? "var(--orange)"
                    : "var(--red)";

    }


    renderInvoiceSection(product);

    resetAnalyzer();

    renderServiceHistory(product);

    renderLifecycle(product);


    modal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeDetails() {

    $("detailsBox")
        ?.classList.add("hidden");


    selectedProduct =
        null;

}


/* =========================================================
   MODAL OVERLAY CLOSE
========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            closeDetails();

        }


        if (
            event.target.classList.contains(
                "command-overlay"
            )
        ) {

            closeCommandPalette();

        }

    }
);


/* =========================================================
   INVOICE SECTION
========================================================= */

function renderInvoiceSection(product) {

    const section =
        $("invoiceSection");


    if (!section) {
        return;
    }


    if (!product.invoice) {

        section.innerHTML = `

            <div class="invoice-card">

                <div>

                    <strong>
                        Invoice vault
                    </strong>

                    <span>
                        No invoice uploaded for this product.
                    </span>

                </div>

            </div>

        `;

        return;

    }


    const invoice =
        product.invoice;


    section.innerHTML = `

        <div class="invoice-card">

            <div>

                <strong>
                    Invoice stored
                </strong>

                <span>
                    ${
                        invoice.fileName ||
                        "Product invoice"
                    }
                </span>

            </div>


            <button
                onclick="viewInvoice()"
            >
                View invoice
            </button>

        </div>

    `;

}


/* =========================================================
   VIEW INVOICE
========================================================= */

async function viewInvoice() {

    if (
        !selectedProduct ||
        !selectedProduct.invoice
    ) {

        showToast(
            "No invoice is available.",
            "warning"
        );

        return;
    }


    const invoice =
        selectedProduct.invoice;


    /*
     If backend provides a filename,
     use the invoice route.
    */

    if (invoice.filename) {

        const url =
            `${API}/invoices/${encodeURIComponent(
                invoice.filename
            )}`;


        window.open(
            url,
            "_blank"
        );


        return;

    }


    /*
     If backend provides a direct URL.
    */

    if (invoice.url) {

        window.open(
            invoice.url,
            "_blank"
        );

        return;

    }


    showToast(
        "Invoice file information is unavailable.",
        "warning"
    );

}


/* =========================================================
   REPAIR VS REPLACE
========================================================= */

function resetAnalyzer() {

    if ($("repairCost")) {

        $("repairCost").value = "";

    }


    if ($("previousRepairCost")) {

        $("previousRepairCost").value = "";

    }


    if ($("replacementCost")) {

        $("replacementCost").value = "";

    }


    if ($("analysisResult")) {

        $("analysisResult").innerHTML = "";

    }

}


/* =========================================================
   ANALYZE REPAIR
========================================================= */

function analyzeRepair() {

    const repair =
        Number(
            $("repairCost").value
        );


    const previous =
        Number(
            $("previousRepairCost").value
        );


    const replacement =
        Number(
            $("replacementCost").value
        );


    if (
        !repair ||
        !replacement
    ) {

        showToast(
            "Enter repair and replacement costs.",
            "warning"
        );

        return;
    }


    const lifetimeRepairCost =
        repair +
        previous;


    const repairRatio =
        repair /
        replacement;


    let title;

    let message;

    let className;


    if (
        repairRatio <= 0.35 &&
        lifetimeRepairCost <
            replacement * 0.65
    ) {

        title =
            "Repair looks reasonable";


        message =
            "The current repair cost is relatively low compared with replacing the product.";

        className =
            "analysis-card";

    }


    else if (
        repairRatio >= 0.65 ||
        lifetimeRepairCost >=
            replacement * 0.8
    ) {

        title =
            "Replacement may be better";


        message =
            "Repair costs are becoming significant compared with the replacement cost.";

        className =
            "analysis-card danger";

    }


    else {

        title =
            "Compare both options";


        message =
            "The costs are in the middle range. Consider product age, warranty coverage and expected future repairs.";

        className =
            "analysis-card warning";

    }


    $("analysisResult").innerHTML = `

        <div class="${className}">

            <strong>
                ${title}
            </strong>

            <p>
                ${message}
            </p>

        </div>

    `;

}


/* =========================================================
   SERVICE HISTORY
========================================================= */

function renderServiceHistory(product) {

    const container =
        $("serviceHistory");


    if (!container) {
        return;
    }


    const history =
        Array.isArray(
            product.serviceHistory
        )
            ? product.serviceHistory
            : [];


    if (!history.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    +
                </div>

                <h3>
                    No service records
                </h3>

                <p>
                    Add your first maintenance or repair record.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    [...history]
        .reverse()
        .forEach(record => {

            const item =
                document.createElement("div");


            item.className =
                "service-record";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            record.type ||
                            "Service"
                        )}
                    </strong>

                    <span>
                        ${formatDate(
                            record.date
                        )}
                    </span>

                </div>


                <div>

                    <strong>
                        ${
                            record.cost
                                ? formatCurrency(
                                    record.cost
                                )
                                : "—"
                        }
                    </strong>

                    <span>
                        ${escapeHTML(
                            record.notes ||
                            "No notes"
                        )}
                    </span>

                </div>

            `;


            container.appendChild(item);

        });

}


/* =========================================================
   ADD SERVICE
========================================================= */

async function handleAddService(event) {

    event.preventDefault();


    if (
        !selectedProduct ||
        !selectedProduct.id
    ) {

        return;
    }


    const type =
        $("serviceType").value;


    const date =
        $("serviceDate").value;


    const cost =
        Number(
            $("serviceCost").value
        ) || 0;


    const notes =
        $("serviceNotes")
            .value
            .trim();


    if (!date) {

        showToast(
            "Select a service date.",
            "warning"
        );

        return;
    }


    const service = {

        userId:
            currentUser.id,

        productId:
            selectedProduct.id,

        type,

        date,

        cost,

        notes

    };


    try {

        const response = await fetch(
            `${API}/api/products/service`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(service)
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to save service."
            );

        }


        showToast(
            "Service record saved.",
            "success"
        );


        $("serviceForm").reset();


        await loadProducts();


        /*
         Find updated product.
        */

        const updated =
            products.find(
                p =>
                    String(p.id) ===
                    String(selectedProduct.id)
            );


        if (updated) {

            selectedProduct =
                updated;

            renderServiceHistory(
                updated
            );

            renderLifecycle(
                updated
            );

        }


        $("serviceDate").value =
            new Date()
                .toISOString()
                .split("T")[0];


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to save service record.",
            "error"
        );

    }

}


/* =========================================================
   LIFECYCLE
========================================================= */

function renderLifecycle(product) {

    const container =
        $("productLifecycle");


    if (!container) {
        return;
    }


    const purchaseDate =
        product.purchaseDate;


    const warrantyEnd =
        product.warrantyEnd;


    const services =
        Array.isArray(
            product.serviceHistory
        )
            ? product.serviceHistory
            : [];


    const hasService =
        services.length > 0;


    const warrantyExpired =
        warrantyEnd &&
        daysUntil(warrantyEnd) < 0;


    const stages = [

        {
            name: "Purchased",
            date: purchaseDate,
            icon: "✓",
            active: true
        },

        {
            name: "Warranty",
            date: warrantyEnd,
            icon: "◈",
            active: !!warrantyEnd
        },

        {
            name: "Servicing",
            date: hasService
                ? services[0].date
                : product.nextService,
            icon: "◷",
            active: hasService
        },

        {
            name: "Extended Life",
            date: null,
            icon: "↗",
            active:
                hasService ||
                warrantyExpired
        },

        {
            name: "Replacement",
            date: null,
            icon: "↻",
            active: false
        }

    ];


    container.innerHTML = "";


    stages.forEach(stage => {

        const item =
            document.createElement("div");


        item.className =
            `lifecycle-step ${
                stage.active
                    ? "active"
                    : ""
            }`;


        item.innerHTML = `

            <div class="lifecycle-dot">
                ${stage.icon}
            </div>

            <strong>
                ${stage.name}
            </strong>

            <span>
                ${
                    stage.date
                        ? formatDate(stage.date)
                        : "Future"
                }
            </span>

        `;


        container.appendChild(item);

    });

}


/* =========================================================
   PRODUCT HEALTH
========================================================= */

function calculateProductHealth(product) {

    let score = 100;


    /*
     Age penalty
    */

    if (product.purchaseDate) {

        const ageMonths =
            monthsSince(
                product.purchaseDate
            );


        if (ageMonths > 60) {

            score -= 30;

        } else if (ageMonths > 36) {

            score -= 20;

        } else if (ageMonths > 24) {

            score -= 10;

        }

    }


    /*
     Warranty penalty
    */

    if (
        product.warrantyEnd &&
        daysUntil(product.warrantyEnd) < 0
    ) {

        score -= 8;

    }


    /*
     Service penalty
    */

    if (
        product.nextService &&
        daysUntil(product.nextService) < 0
    ) {

        score -= 12;

    }


    /*
     Service history can actually
     improve confidence.
    */

    if (
        Array.isArray(
            product.serviceHistory
        ) &&
        product.serviceHistory.length > 0
    ) {

        score += 4;

    }


    return Math.max(
        0,
        Math.min(100, score)
    );

}


/* =========================================================
   GET HEALTH
========================================================= */

function getHealth(product) {

    const calculated =
        calculateProductHealth(
            product
        );


    /*
     If backend already stores a valid
     health score, use it.
    */

    if (
        typeof product.health === "number" &&
        product.health >= 0 &&
        product.health <= 100
    ) {

        /*
         Keep calculated logic useful by
         combining stored and calculated values.
        */

        return Math.round(
            (
                product.health +
                calculated
            ) / 2
        );

    }


    return calculated;

}


/* =========================================================
   WARRANTY
========================================================= */

function isWarrantyActive(product) {

    if (!product.warrantyEnd) {

        return false;

    }


    return daysUntil(
        product.warrantyEnd
    ) >= 0;

}


/* =========================================================
   SERVICE DUE
========================================================= */

function isServiceDue(product) {

    if (!product.nextService) {

        return false;

    }


    return daysUntil(
        product.nextService
    ) <= 30;

}


/* =========================================================
   HEALTH LABEL
========================================================= */

function getHealthLabel(score) {

    if (score >= 80) {

        return "Excellent";

    }


    if (score >= 65) {

        return "Healthy";

    }


    if (score >= 50) {

        return "Needs Attention";

    }


    return "Critical";

}


/* =========================================================
   PRODUCT ICON
========================================================= */

function getProductIcon(category) {

    const value =
        String(
            category || ""
        ).toLowerCase();


    if (
        value.includes("mobile") ||
        value.includes("phone")
    ) {

        return "📱";

    }


    if (
        value.includes("laptop") ||
        value.includes("computer")
    ) {

        return "💻";

    }


    if (
        value.includes("tv") ||
        value.includes("television")
    ) {

        return "📺";

    }


    if (
        value.includes("appliance")
    ) {

        return "🏠";

    }


    if (
        value.includes("vehicle") ||
        value.includes("car")
    ) {

        return "🚗";

    }


    if (
        value.includes("furniture")
    ) {

        return "🛋️";

    }


    if (
        value.includes("electronics")
    ) {

        return "⚡";

    }


    return "📦";

}


/* =========================================================
   DATE HELPERS
========================================================= */

function calculateFutureDate(
    startDate,
    months
) {

    const date =
        new Date(
            startDate
        );


    date.setMonth(
        date.getMonth() +
        Number(months)
    );


    return date
        .toISOString()
        .split("T")[0];

}


/* =========================================================
   DAYS UNTIL
========================================================= */

function daysUntil(dateString) {

    if (!dateString) {

        return Infinity;

    }


    const target =
        new Date(
            dateString
        );


    const today =
        new Date();


    target.setHours(
        0,
        0,
        0,
        0
    );


    today.setHours(
        0,
        0,
        0,
        0
    );


    const diff =
        target.getTime() -
        today.getTime();


    return Math.ceil(
        diff /
        (
            1000 *
            60 *
            60 *
            24
        )
    );

}


/* =========================================================
   MONTHS SINCE
========================================================= */

function monthsSince(dateString) {

    const date =
        new Date(
            dateString
        );


    const today =
        new Date();


    return (
        (today.getFullYear() -
            date.getFullYear()) *
            12
        +
        (
            today.getMonth() -
            date.getMonth()
        )
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateString) {

    if (!dateString) {

        return "—";

    }


    const date =
        new Date(
            dateString
        );


    if (Number.isNaN(
        date.getTime()
    )) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   THEME
========================================================= */

function initializeUI() {

    const savedTheme =
        localStorage.getItem(
            "productcare_theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    $("themeBtn")?.addEventListener(
        "click",
        toggleTheme
    );

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "productcare_theme",
        isDark
            ? "dark"
            : "light"
    );


    showToast(
        isDark
            ? "Dark mode enabled."
            : "Light mode enabled.",
        "success"
    );

}


/* =========================================================
   COMMAND PALETTE
========================================================= */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                openCommandPalette();

            }


            if (
                event.key === "Escape"
            ) {

                closeCommandPalette();

                closeDetails();

            }

        }
    );


    $("commandSearch")?.addEventListener(
        "input",
        filterCommands
    );

}


function openCommandPalette() {

    $("commandPalette")
        ?.classList.remove(
            "hidden"
        );


    setTimeout(() => {

        $("commandSearch")
            ?.focus();

    }, 50);

}


function closeCommandPalette() {

    $("commandPalette")
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   COMMAND SEARCH
========================================================= */

function filterCommands() {

    const query =
        $("commandSearch")
            ?.value
            .trim()
            .toLowerCase() || "";


    const buttons =
        document.querySelectorAll(
            "#commandList button"
        );


    buttons.forEach(button => {

        const text =
            button.textContent
                .toLowerCase();


        button.style.display =
            text.includes(query)
                ? "flex"
                : "none";

    });

}


/* =========================================================
   COMMAND GUIDE
========================================================= */

function openCommandGuide() {

    openCommandPalette();

}


/* =========================================================
   SCROLL TO ADD PRODUCT
========================================================= */

function scrollToAddProduct() {

    closeCommandPalette();


    const section =
        $("addProductSection");


    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    setTimeout(() => {

        $("productName")?.focus();

    }, 500);

}


/* =========================================================
   FOCUS PRODUCT SEARCH
========================================================= */

function focusProductSearch() {

    closeCommandPalette();


    const search =
        $("productSearch");


    if (search) {

        search.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        setTimeout(() => {

            search.focus();

        }, 400);

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");


    if (!container) {
        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    let icon =
        "✓";


    if (type === "error") {

        icon = "×";

    }


    if (type === "warning") {

        icon = "!";

    }


    toast.innerHTML = `

        <div class="toast-icon">
            ${icon}
        </div>

        <div>

            <strong>
                ProductCare
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateX(30px)";


        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 3500);

}


/* =========================================================
   DEFAULT SERVICE DATE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if ($("serviceDate")) {

            $("serviceDate").value =
                new Date()
                    .toISOString()
                    .split("T")[0];

        }

    }
);


/* =========================================================
   CLICK ESCAPE / OUTSIDE SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            if (
                !$("detailsBox")
                    ?.classList.contains(
                        "hidden"
                    )
            ) {

                closeDetails();

            }

        }

    }
);


/* =========================================================
   PREVENT DOUBLE FORM SUBMISSION
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target;


        if (
            form.tagName !== "FORM"
        ) {

            return;

        }

        /*
         Actual submit handlers above
         handle the API operations.
         This listener intentionally
         does not prevent submission.
        */

    }
);


/* =========================================================
   EXPORT FOR INLINE HTML ACTIONS
========================================================= */

window.closeDetails =
    closeDetails;


window.viewInvoice =
    viewInvoice;


window.analyzeRepair =
    analyzeRepair;


window.toggleTheme =
    toggleTheme;


window.scrollToAddProduct =
    scrollToAddProduct;


window.focusProductSearch =
    focusProductSearch;


window.openCommandGuide =
    openCommandGuide;