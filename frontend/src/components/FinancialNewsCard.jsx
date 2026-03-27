import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';

const FinancialNewsCard = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchNews();
  }, []);

  // Auto-rotate news every 8 seconds
  useEffect(() => {
    if (!news || news.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % news.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [news]);

  const fetchNews = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/news/financial');
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setNews(data.articles);
      } else {
        setNews(getDefaultNews());
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNews(getDefaultNews());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultNews = () => [
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
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-50 h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <p className="text-xs text-gray-400">Loading news...</p>
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-50 h-full flex flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-gray-500">No News Available</p>
        <p className="text-xs text-gray-400 mt-2">Check back later for financial updates</p>
      </div>
    );
  }

  const currentArticle = news[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % news.length);
  };

  const handleCardClick = () => {
    // Only redirect if we have a valid link
    if (currentArticle?.link && currentArticle.link !== '#' && currentArticle.link.trim()) {
      try {
        window.open(currentArticle.link, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.error('Failed to open link:', err);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden h-full flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-blue-100" onClick={handleCardClick}>
      {/* Header */}
      <div className="flex items-center gap-2 p-6 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <TrendingUp size={16} className="text-blue-600" />
        </div>
        <h3 className="text-slate-700 font-bold text-sm tracking-tight">Financial Insights Feed</h3>
      </div>

      {/* News Content */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3 h-full"
        >
          {/* Image */}
          {currentArticle.image ? (
            <div className="w-full h-36 rounded-lg overflow-hidden bg-gray-200">
              <img
                src={currentArticle.image}
                alt={currentArticle.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-36 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={24} className="text-blue-300 mx-auto mb-2" />
                <p className="text-xs text-blue-400 font-semibold">Financial News</p>
              </div>
            </div>
          )}

          {/* Date Badge */}
          <div className="inline-flex w-fit">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wide bg-blue-100 px-2.5 py-1 rounded-lg">
              {currentArticle.pubDate}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-gray-800 leading-snug line-clamp-3">
            {currentArticle.title}
          </h4>

          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-4">
            {currentArticle.description}
          </p>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        {/* Dots Indicator */}
        <div className="flex justify-center gap-1.5 flex-1">
          {news.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 w-1.5 hover:bg-gray-400'
              }`}
              aria-label={`Article ${idx + 1}`}
              title={`Article ${idx + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-gray-200 transition-colors"
          title="Next article"
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      </div>

      {/* Article Counter */}
      <div className="px-5 py-2 text-center border-t border-gray-100 bg-white">
        <p className="text-xs text-gray-500 font-semibold">
          {activeIndex + 1} <span className="text-gray-400">of</span> {news.length}
        </p>
      </div>
    </div>
  );
};

export default FinancialNewsCard;
