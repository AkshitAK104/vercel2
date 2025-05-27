require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require('@supabase/supabase-js');
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL and Key are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Email transporter setup ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "cakshit131@gmail.com",
    pass: process.env.EMAIL_PASS || "akchaudhary",
  },
});

// Test email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email configuration error:", error);
  } else {
    console.log("✅ Email server is ready");
  }
});

// === HEALTH CHECK ===
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Price Tracker API is running",
    timestamp: new Date().toISOString()
  });
});

// === TEST SUPABASE CONNECTION ===
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact' });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: "Database connected successfully",
      productCount: data.length
    });
  } catch (err) {
    console.error("Database test error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Database connection failed",
      error: err.message 
    });
  }
});

// === PRODUCT TRACKING (AMAZON) ===
app.post("/track-product", async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      message: "URL is required." 
    });
  }

  // Validate Amazon URL
  if (!url.includes('amazon.')) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide a valid Amazon product URL." 
    });
  }

  try {
    console.log("🔍 Scraping product:", url);
    
    const response = await axios.get(url, { 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract product title
    const title = $("#productTitle").text().trim() || 
                  $(".product-title").text().trim() ||
                  $("h1").first().text().trim();
    
    // Extract price with multiple selectors
    const priceSelectors = [
      "#priceblock_ourprice",
      "#priceblock_dealprice", 
      "#priceblock_saleprice",
      ".a-price .a-offscreen",
      ".a-price-whole",
      "#price_inside_buybox",
      ".a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen"
    ];
    
    let priceText = "";
    for (const selector of priceSelectors) {
      priceText = $(selector).first().text().trim();
      if (priceText) break;
    }
    
    // Clean and parse price
    const price = parseFloat(priceText.replace(/[₹,\s]/g, "").replace(/[^0-9.]/g, ""));
    
    // Extract image
    const image = $("#imgTagWrapperId img").attr("src") || 
                  $("#landingImage").attr("src") ||
                  $(".a-dynamic-image").first().attr("src") ||
                  "";

    if (!title || !price || isNaN(price)) {
      console.log("❌ Failed to extract:", { title, priceText, price });
      return res.status(400).json({ 
        success: false, 
        message: "Failed to extract valid product data. Please check if the URL is correct and accessible." 
      });
    }

    const currentDate = new Date().toISOString();
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: title,
        url: url,
        image: image,
        current_price: price,
        price_history: [{ date: currentDate, price }],
        created_at: currentDate
      }])
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      throw error;
    }

    console.log("✅ Product tracked successfully:", title);
    res.json({ success: true, product: data });
    
  } catch (err) {
    console.error("Track Error:", err.message);
    
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      res.status(500).json({ 
        success: false, 
        message: "Network error. Please check your internet connection." 
      });
    } else if (err.response?.status === 403) {
      res.status(500).json({ 
        success: false, 
        message: "Access denied by Amazon. Please try again later." 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch or store product. Please try again." 
      });
    }
  }
});

// === GET ALL PRODUCTS ===
app.get("/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const products = data.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      image: row.image,
      currentPrice: row.current_price,
      priceHistory: row.price_history || [],
      createdAt: row.created_at,
      alert: null,
    }));
    
    res.json({ success: true, products });
  } catch (err) {
    console.error("Fetch Error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch products." 
    });
  }
});

// === DELETE PRODUCT ===
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete product." 
    });
  }
});

// === ALERT CREATION ===
app.post("/api/alerts", async (req, res) => {
  const { productId, email, threshold } = req.body;
  
  if (!productId || !email || !threshold) {
    return res.status(400).json({ 
      success: false, 
      message: "Product ID, email, and threshold are required." 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide a valid email address." 
    });
  }

  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([{
        product_id: productId,
        email: email,
        threshold: parseFloat(threshold),
        alert_sent: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: "Alert saved successfully", alert: data });
  } catch (err) {
    console.error("Alert Error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save alert." 
    });
  }
});

// === CRON JOB: PRICE CHECK & ALERT ===
cron.schedule("*/30 * * * *", async () => {
  console.log("🔄 Running scheduled price update...");

  try {
    // Fetch all products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*');

    if (productError) throw productError;

    // Fetch unsent alerts
    const { data: alerts, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('alert_sent', false);

    if (alertError) throw alertError;

    console.log(`📊 Processing ${products.length} products and ${alerts.length} alerts`);

    for (const product of products) {
      try {
        console.log(`🔍 Checking price for: ${product.name}`);
        
        const response = await axios.get(product.url, { 
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        const priceSelectors = [
          "#priceblock_ourprice",
          "#priceblock_dealprice", 
          "#priceblock_saleprice",
          ".a-price .a-offscreen",
          ".a-price-whole",
          "#price_inside_buybox"
        ];
        
        let priceText = "";
        for (const selector of priceSelectors) {
          priceText = $(selector).first().text().trim();
          if (priceText) break;
        }
        
        const price = parseFloat(priceText.replace(/[₹,\s]/g, "").replace(/[^0-9.]/g, ""));
        
        if (!price || isNaN(price)) {
          console.log(`⚠️ Could not extract price for ${product.name}`);
          continue;
        }

        const currentDate = new Date().toISOString();
        const updatedHistory = [...(product.price_history || []), { date: currentDate, price }];

        // Update product with new price
        const { error: updateError } = await supabase
          .from('products')
          .update({
            current_price: price,
            price_history: updatedHistory
          })
          .eq('id', product.id);

        if (updateError) throw updateError;

        console.log(`💰 Updated price for ${product.name}: ₹${price}`);

        // Check for matching alerts
        const matchingAlerts = alerts.filter(alert =>
          alert.product_id === product.id && price <= alert.threshold
        );

        for (const alert of matchingAlerts) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER || "cakshit131@gmail.com",
              to: alert.email,
              subject: "🔔 Price Drop Alert!",
              html: `
                <h2>🎉 Great News! Price Drop Alert</h2>
                <p>The price for your tracked product has dropped!</p>
                <h3>${product.name}</h3>
                <p><strong>New Price: ₹${price}</strong></p>
                <p>Your Alert Threshold: ₹${alert.threshold}</p>
                <p><a href="${product.url}" style="background-color: #ff9900; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Product</a></p>
                <p>Happy Shopping! 🛒</p>
              `,
            });

            // Mark alert as sent
            const { error: alertUpdateError } = await supabase
              .from('alerts')
              .update({ alert_sent: true })
              .eq('id', alert.id);

            if (alertUpdateError) throw alertUpdateError;

            console.log(`📧 Sent alert to ${alert.email} for ${product.name}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${alert.email}:`, emailError.message);
          }
        }
      } catch (err) {
        console.error(`❌ Failed to update ${product.name}:`, err.message);
      }
    }
    
    console.log("✅ Price update cycle completed");
  } catch (err) {
    console.error("🚨 Cron Job Error:", err.message);
  }
});

// === MULTI-PLATFORM ROUTES ===
const multiplatformRoutes = require('./multiplatform');
app.use('/api/multiplatform', multiplatformRoutes);

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});

// === 404 HANDLER ===
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER || 'cakshit131@gmail.com'}`);
});
