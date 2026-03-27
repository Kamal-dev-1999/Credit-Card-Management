/**
 * newsService.js
 * Fetches financial news from public APIs and RSS feeds
 */

const https = require('https');
const http = require('http');

/**
 * Fetch from NewsAPI (free tier available)
 */
const fetchFromNewsAPI = async () => {
  return new Promise((resolve) => {
    // Using NewsAPI.org for financial news
    const apiKey = process.env.NEWS_API_KEY;
    
    // If no API key, skip to RSS
    if (!apiKey || apiKey === 'demo' || apiKey === 'your_newsapi_key_here') {
      console.log('⚠️  NewsAPI key not configured, skipping...');
      resolve(null);
      return;
    }
    
    const newsApiUrl = `https://newsapi.org/v2/everything?q=credit+card+OR+debt+management+OR+personal+finance&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;
    
    console.log(`🔄 Fetching from NewsAPI (timeout: 8s)...`);
    
    const options = {
      timeout: 8000,
      headers: {
        'User-Agent': 'CreditCardManagementApp/1.0 (Financial News Fetcher)'
      }
    };
    
    const req = https.get(newsApiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Check for API errors
          if (json.status === 'error') {
            console.log(`⚠️  NewsAPI Error: ${json.message}`);
            resolve(null);
            return;
          }
          
          if (json.articles && json.articles.length > 0) {
            const articles = json.articles
              .filter(article => article.url && article.url.startsWith('http')) // Only valid URLs
              .map(article => ({
                title: article.title || 'Unknown',
                description: (article.description || article.content || 'No description available').substring(0, 120) + '...',
                link: article.url,
                pubDate: new Date(article.publishedAt).toLocaleDateString('en-IN'),
                image: article.urlToImage || null
              }))
              .slice(0, 5);
            
            console.log(`✅ Got ${articles.length} LIVE articles from NewsAPI`);
            resolve(articles);
            return;
          }
        } catch (e) {
          console.log(`⚠️  NewsAPI parse error:`, e.message);
        }
        resolve(null);
      });
    });

    req.on('error', (err) => {
      console.log(`⚠️  NewsAPI connection error:`, err.message);
      resolve(null);
    });

    req.on('timeout', () => {
      console.log('⚠️  NewsAPI request timeout (>8s)');
      req.destroy();
      resolve(null);
    });
  });
};

/**
 * Improved RSS feed parser with image extraction
 */
const parseRSSFeed = (xmlData) => {
  const articles = [];
  
  try {
    // Extract all item blocks
    const itemRegex = /<item\b[^>]*>[\s\S]*?<\/item>/gi;
    const items = xmlData.match(itemRegex) || [];

    items.slice(0, 5).forEach(item => {
      // Extract title
      const titleMatch = item.match(/<title\b[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? decodeHTML(titleMatch[1].trim()) : null;

      // Extract description/content
      let description = null;
      const descMatch = item.match(/<description\b[^>]*>([^<]+)<\/description>/i);
      const contentMatch = item.match(/<content\b[^>]*>([^<]+)<\/content>/i);
      
      if (descMatch) description = decodeHTML(descMatch[1].trim()).substring(0, 120);
      else if (contentMatch) description = decodeHTML(contentMatch[1].trim()).substring(0, 120);

      // Extract link - try multiple patterns
      let link = null;
      
      // Try standard link tag
      const linkMatch = item.match(/<link\b[^>]*>([^<]+)<\/link>/i);
      if (linkMatch) link = linkMatch[1].trim();
      
      // Try guid as fallback
      if (!link) {
        const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/i);
        if (guidMatch) {
          const guid = guidMatch[1].trim();
          // Only use guid if it looks like a URL
          if (guid.startsWith('http')) link = guid;
        }
      }
      
      // Only proceed if we have a valid HTTP(S) link
      if (!link || (!link.startsWith('http://') && !link.startsWith('https://'))) {
        link = null;
      }

      // Extract date
      const dateMatch = item.match(/<pubDate\b[^>]*>([^<]+)<\/pubDate>/i);
      const pubDate = dateMatch ? new Date(dateMatch[1]).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

      // Extract image - try multiple sources
      let image = null;
      
      // Try media:content or media:thumbnail
      const mediaMatch = item.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i);
      if (mediaMatch) image = mediaMatch[1];
      
      // Try enclosure
      if (!image) {
        const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
        if (enclosureMatch) image = enclosureMatch[1];
      }
      
      // Try image tag
      if (!image) {
        const imgMatch = item.match(/<image[^>]*>[\s\S]*?<url>([^<]+)<\/url>/i);
        if (imgMatch) image = imgMatch[1];
      }

      // Only add if we have title and a valid link
      if (title && title !== 'Unknown' && link) {
        articles.push({
          title: title || 'Financial News',
          description: description || 'Latest financial update',
          link: link,
          pubDate: pubDate,
          image: image || null
        });
      }
    });
  } catch (err) {
    console.error('RSS Parse error:', err.message);
  }

  return articles;
};

/**
 * HTML entity decoder
 */
const decodeHTML = (html) => {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  
  return html.replace(/&[a-z]+;/gi, (match) => entities[match] || match);
};

/**
 * Fetch RSS feed with timeout
 */
const fetchRSSFeed = (url, protocol = 'https') => {
  return new Promise((resolve) => {
    const client = protocol === 'https' ? https : http;
    
    const req = client.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 4000
    }, (res) => {
      let data = '';
      
      // Only accept text responses
      if (!res.headers['content-type'].includes('text')) {
        resolve(null);
        return;
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const articles = parseRSSFeed(data);
        resolve(articles.length > 0 ? articles : null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    setTimeout(() => {
      req.destroy();
      resolve(null);
    }, 4000);
  });
};

/**
 * Get financial news from multiple sources
 */
const getFinancialNews = async () => {
  console.log('\n🔍 Starting financial news fetch...');
  
  // Try NewsAPI first (most reliable for live data)
  let articles = await fetchFromNewsAPI();
  
  if (articles && articles.length > 0) {
    console.log(`✅ SUCCESS: Returning ${articles.length} LIVE articles from NewsAPI\n`);
    return articles;
  }

  console.log('⚠️  NewsAPI didn\'t provide data. Falling back to cached data with Investopedia links.\n');
  
  // Skip RSS feeds (they're often slow/blocked) and go straight to smart fallback
  // The fallback contains real Investopedia links which are always accessible
  return getFallbackNews();
};

/**
 * Fallback news if RSS fails
 */
const getFallbackNews = () => {
  return [
    {
      title: "How to Manage Credit Card Debt Effectively",
      description: "Learn proven strategies to pay off credit card debt faster and save on interest...",
      link: "https://www.investopedia.com/terms/c/credit-card-debt.asp",
      pubDate: new Date().toLocaleDateString('en-IN')
    },
    {
      title: "Building and Maintaining a Good Credit Score",
      description: "Understand what impacts your credit score and how to improve it...",
      link: "https://www.investopedia.com/terms/c/credit_score.asp",
      pubDate: new Date().toLocaleDateString('en-IN')
    },
    {
      title: "Credit Card Rewards: Maximizing Your Benefits",
      description: "Tips on how to earn and maximize rewards from your credit cards...",
      link: "https://www.investopedia.com/articles/personal-finance/050815/credit-card-rewards-how-they-work.asp",
      pubDate: new Date().toLocaleDateString('en-IN')
    },
    {
      title: "Creating an Emergency Fund: Financial Safety Net",
      description: "Why you need an emergency fund and how much you should save...",
      link: "https://www.investopedia.com/terms/e/emergency_fund.asp",
      pubDate: new Date().toLocaleDateString('en-IN')
    },
    {
      title: "Smart Budgeting Tips for Personal Finance",
      description: "Learn effective budgeting strategies to manage your money better...",
      link: "https://www.investopedia.com/terms/b/budgeting.asp",
      pubDate: new Date().toLocaleDateString('en-IN')
    }
  ];
};

module.exports = { getFinancialNews };
