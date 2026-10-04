const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 5000;

const PRODUCTS_FILE = "products.json";
const USERS_FILE = "users.json";
const INVOICE_FOLDER = "invoices";


// ==========================================
// CREATE REQUIRED FILES / FOLDERS
// ==========================================

if (!fs.existsSync(PRODUCTS_FILE)) {

    fs.writeFileSync(
        PRODUCTS_FILE,
        "[]"
    );

}


if (!fs.existsSync(USERS_FILE)) {

    fs.writeFileSync(
        USERS_FILE,
        "[]"
    );

}


if (!fs.existsSync(INVOICE_FOLDER)) {

    fs.mkdirSync(INVOICE_FOLDER);

}


// ==========================================
// PASSWORD HASH
// ==========================================

function hashPassword(password) {

    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

}


// ==========================================
// READ JSON FILE
// ==========================================

function readJson(file) {

    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );

}


// ==========================================
// WRITE JSON FILE
// ==========================================

function writeJson(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


// ==========================================
// SEND JSON RESPONSE
// ==========================================

function sendJson(
    res,
    status,
    data
) {

    res.writeHead(
        status,
        {
            "Content-Type":
                "application/json"
        }
    );

    res.end(
        JSON.stringify(data)
    );

}


// ==========================================
// READ REQUEST BODY
// ==========================================

function getRequestBody(req) {

    return new Promise(
        (resolve, reject) => {

            let body = "";

            req.on(
                "data",
                chunk => {

                    body += chunk;

                }
            );


            req.on(
                "end",
                () => {

                    try {

                        resolve(
                            JSON.parse(body || "{}")
                        );

                    } catch (error) {

                        reject(error);

                    }

                }
            );


            req.on(
                "error",
                error => {

                    reject(error);

                }
            );

        }
    );

}


// ==========================================
// SERVER
// ==========================================

const server =
    http.createServer(
        async (req, res) => {

            // ==================================
            // CORS
            // ==================================

            res.setHeader(
                "Access-Control-Allow-Origin",
                "*"
            );

            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST"
            );

            res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type"
            );


            // ==================================
            // OPTIONS
            // ==================================

            if (
                req.method ===
                "OPTIONS"
            ) {

                res.writeHead(200);

                res.end();

                return;

            }


            // ==================================
            // SIGNUP
            // ==================================

            if (
                req.method === "POST" &&
                req.url === "/api/auth/signup"
            ) {

                try {

                    const data =
                        await getRequestBody(req);


                    const name =
                        data.name?.trim();


                    const email =
                        data.email
                        ?.trim()
                        .toLowerCase();


                    const password =
                        data.password;


                    // Validation

                    if (
                        !name ||
                        !email ||
                        !password
                    ) {

                        sendJson(
                            res,
                            400,
                            {
                                message:
                                    "Please fill all fields."
                            }
                        );

                        return;

                    }


                    if (
                        password.length < 6
                    ) {

                        sendJson(
                            res,
                            400,
                            {
                                message:
                                    "Password must contain at least 6 characters."
                            }
                        );

                        return;

                    }


                    const users =
                        readJson(
                            USERS_FILE
                        );


                    // Check existing user

                    const existingUser =
                        users.find(
                            user =>
                                user.email ===
                                email
                        );


                    if (existingUser) {

                        sendJson(
                            res,
                            409,
                            {
                                message:
                                    "An account with this email already exists."
                            }
                        );

                        return;

                    }


                    // Create user

                    const user = {

                        id:
                            Date.now(),

                        name:
                            name,

                        email:
                            email,

                        password:
                            hashPassword(
                                password
                            )

                    };


                    users.push(user);


                    writeJson(
                        USERS_FILE,
                        users
                    );


                    // Don't send password

                    sendJson(
                        res,
                        201,
                        {

                            message:
                                "Account created successfully.",

                            user: {

                                id:
                                    user.id,

                                name:
                                    user.name,

                                email:
                                    user.email

                            }

                        }
                    );


                } catch (error) {

                    console.error(error);


                    sendJson(
                        res,
                        400,
                        {
                            message:
                                "Invalid signup data."
                        }
                    );

                }


                return;

            }



            // ==================================
            // LOGIN
            // ==================================

            if (
                req.method === "POST" &&
                req.url === "/api/auth/login"
            ) {

                try {

                    const data =
                        await getRequestBody(req);


                    const email =
                        data.email
                        ?.trim()
                        .toLowerCase();


                    const password =
                        data.password;


                    if (
                        !email ||
                        !password
                    ) {

                        sendJson(
                            res,
                            400,
                            {
                                message:
                                    "Please enter email and password."
                            }
                        );

                        return;

                    }


                    const users =
                        readJson(
                            USERS_FILE
                        );


                    const user =
                        users.find(
                            user =>
                                user.email ===
                                email
                        );


                    if (!user) {

                        sendJson(
                            res,
                            401,
                            {
                                message:
                                    "Invalid email or password."
                            }
                        );

                        return;

                    }


                    const passwordHash =
                        hashPassword(
                            password
                        );


                    if (
                        passwordHash !==
                        user.password
                    ) {

                        sendJson(
                            res,
                            401,
                            {
                                message:
                                    "Invalid email or password."
                            }
                        );

                        return;

                    }


                    sendJson(
                        res,
                        200,
                        {

                            message:
                                "Login successful.",

                            user: {

                                id:
                                    user.id,

                                name:
                                    user.name,

                                email:
                                    user.email

                            }

                        }
                    );


                } catch (error) {

                    console.error(error);


                    sendJson(
                        res,
                        400,
                        {
                            message:
                                "Invalid login data."
                        }
                    );

                }


                return;

            }



            // ==================================
            // GET PRODUCTS FOR USER
            // ==================================

            if (
                req.method === "GET" &&
                req.url.startsWith(
                    "/api/products"
                )
            ) {

                const url =
                    new URL(
                        req.url,
                        `http://localhost:${PORT}`
                    );


                const userId =
                    url.searchParams.get(
                        "userId"
                    );


                const products =
                    readJson(
                        PRODUCTS_FILE
                    );


                let userProducts =
                    products;


                if (userId) {

                    userProducts =
                        products.filter(
                            product =>
                                String(
                                    product.userId
                                ) ===
                                String(userId)
                        );

                }


                sendJson(
                    res,
                    200,
                    userProducts
                );


                return;

            }



            // ==================================
            // ADD PRODUCT
            // ==================================

            if (
                req.method === "POST" &&
                req.url === "/api/products"
            ) {

                try {

                    const product =
                        await getRequestBody(
                            req
                        );


                    const products =
                        readJson(
                            PRODUCTS_FILE
                        );


                    product.id =
                        Date.now();


                    product.services =
                        product.services ||
                        [];


                    product.invoice =
                        product.invoice ||
                        null;


                    products.push(
                        product
                    );


                    writeJson(
                        PRODUCTS_FILE,
                        products
                    );


                    sendJson(
                        res,
                        201,
                        product
                    );


                } catch (error) {

                    console.error(error);


                    sendJson(
                        res,
                        400,
                        {
                            message:
                                "Invalid product data."
                        }
                    );

                }


                return;

            }



            // ==================================
            // ADD SERVICE / REPAIR
            // ==================================

            if (
                req.method === "POST" &&
                req.url ===
                "/api/products/service"
            ) {

                try {

                    const data =
                        await getRequestBody(
                            req
                        );


                    const products =
                        readJson(
                            PRODUCTS_FILE
                        );


                    const product =
                        products.find(
                            p =>
                                Number(p.id) ===
                                Number(
                                    data.productId
                                )
                        );


                    if (!product) {

                        sendJson(
                            res,
                            404,
                            {
                                message:
                                    "Product not found."
                            }
                        );

                        return;

                    }


                    if (
                        !product.services
                    ) {

                        product.services =
                            [];

                    }


                    product.services.push(
                        data.service
                    );


                    writeJson(
                        PRODUCTS_FILE,
                        products
                    );


                    sendJson(
                        res,
                        200,
                        product
                    );


                } catch (error) {

                    console.error(error);


                    sendJson(
                        res,
                        400,
                        {
                            message:
                                "Invalid service data."
                        }
                    );

                }


                return;

            }



            // ==================================
            // UPLOAD INVOICE
            // ==================================

            if (
                req.method === "POST" &&
                req.url ===
                "/api/products/invoice"
            ) {

                try {

                    const data =
                        await getRequestBody(
                            req
                        );


                    const productId =
                        data.productId;


                    const fileName =
                        data.fileName;


                    const fileData =
                        data.fileData;


                    if (
                        !productId ||
                        !fileName ||
                        !fileData
                    ) {

                        sendJson(
                            res,
                            400,
                            {
                                message:
                                    "Missing invoice data."
                            }
                        );

                        return;

                    }


                    const base64Data =
                        fileData.replace(
                            /^data:.+;base64,/,
                            ""
                        );


                    const buffer =
                        Buffer.from(
                            base64Data,
                            "base64"
                        );


                    const safeFileName =
                        Date.now() +
                        "_" +
                        fileName.replace(
                            /[^a-zA-Z0-9._-]/g,
                            "_"
                        );


                    const filePath =
                        path.join(
                            INVOICE_FOLDER,
                            safeFileName
                        );


                    fs.writeFileSync(
                        filePath,
                        buffer
                    );


                    const products =
                        readJson(
                            PRODUCTS_FILE
                        );


                    const product =
                        products.find(
                            p =>
                                Number(p.id) ===
                                Number(productId)
                        );


                    if (!product) {

                        sendJson(
                            res,
                            404,
                            {
                                message:
                                    "Product not found."
                            }
                        );

                        return;

                    }


                    product.invoice = {

                        originalName:
                            fileName,

                        savedName:
                            safeFileName,

                        path:
                            filePath

                    };


                    writeJson(
                        PRODUCTS_FILE,
                        products
                    );


                    sendJson(
                        res,
                        200,
                        product
                    );


                } catch (error) {

                    console.error(error);


                    sendJson(
                        res,
                        500,
                        {
                            message:
                                "Invoice upload failed."
                        }
                    );

                }


                return;

            }



            // ==================================
            // VIEW INVOICE
            // ==================================

            if (
                req.method === "GET" &&
                req.url.startsWith(
                    "/invoices/"
                )
            ) {

                const fileName =
                    decodeURIComponent(
                        req.url.replace(
                            "/invoices/",
                            ""
                        )
                    );


                const filePath =
                    path.join(
                        INVOICE_FOLDER,
                        fileName
                    );


                if (
                    !fs.existsSync(
                        filePath
                    )
                ) {

                    res.writeHead(404);

                    res.end(
                        "Invoice not found"
                    );

                    return;

                }


                const extension =
                    path.extname(
                        filePath
                    ).toLowerCase();


                let contentType =
                    "application/octet-stream";


                if (
                    extension === ".pdf"
                ) {

                    contentType =
                        "application/pdf";

                }

                else if (
                    extension === ".jpg" ||
                    extension === ".jpeg"
                ) {

                    contentType =
                        "image/jpeg";

                }

                else if (
                    extension === ".png"
                ) {

                    contentType =
                        "image/png";

                }


                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            contentType
                    }
                );


                fs.createReadStream(
                    filePath
                ).pipe(res);


                return;

            }



            // ==================================
            // UNKNOWN ROUTE
            // ==================================

            res.writeHead(404);

            res.end(
                "Not Found"
            );

        }
    );


// ==========================================
// START SERVER
// ==========================================

server.listen(
    PORT,
    () => {

        console.log(
            `ProductCare backend running at http://localhost:${PORT}`
        );

    }
);