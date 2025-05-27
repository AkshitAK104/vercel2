const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// === MULTI-PLATFORM PRICE COMPARISON ===
router.post('/compare', async (req, res) => {
  const { productName, urls } = req.body;
  
  if (!productName || !urls || !Array.isArray(urls)) {
    return res.status(400).json({ 
      success: false, 
      message: "Product name and URLs array are required" 
    });
  }

  try {
    const results = [];
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, { 
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Determine platform
        let platform = 'Unknown';
        if (url.includes('amazon.')) platform = 'Amazon';
        else if (url.includes('flipkart.')) platform = 'Flipkart';
        else if (url.includes('myntra.')) platform = 'Myntra';
        
        // Extract price based on platform
        let price = 0;
        if (platform === 'Amazon') {
          const priceText = $("#priceblock_ourprice").text().trim() ||
                           $(".a-price .a-offscreen").first().text().trim();
          price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
        }
        
        if (price && !isNaN(price)) {
          results.push({
            platform,
            url,
            price,
            available: true
          });
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        results.push({
          platform: 'Unknown',
          url,
          price: null,
          available: false,
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      productName,
      results: results.sort((a, b) => a.price - b.price)
    });
    
  } catch (err) {
    console.error("Comparison Error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to compare prices" 
    });
  }
});

module.exports = router;
