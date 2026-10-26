import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ArticleDisplay from './components/ArticleDisplay';
import { generateSEOArticle } from './services/geminiService';
import { GeneratedArticle, GenerationStatus, WritingStyle, ContentFormat } from './types';
import { WRITING_STYLES } from './constants';
import { initAuth, googleSignIn, logout } from './services/authService';
import { User } from 'firebase/auth';
import { Flame, Zap, Crown, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const SUGGESTED_KEYWORDS = [
  "High Ticket Client Acquisition",
  "AI SEO Content Strategy",
  "Omnichannel Digital Marketing",
  "B2B SaaS Growth Frameworks",
  "Conversion Rate Optimization"
];

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<WritingStyle>('ZIGLAR_2026');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingFormat, setLoadingFormat] = useState<ContentFormat | null>(null);

  // Google Workspace auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setGoogleUser(currentUser);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error("Google authentication error:", err);
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
    } catch (err) {
      console.error("Google disconnect error:", err);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setStatus(GenerationStatus.LOADING);
    setLoadingFormat('ALL_PLATFORMS');
    setErrorMsg(null);
    setArticle(null);

    try {
      const result = await generateSEOArticle(keyword.trim(), selectedStyle, 'ALL_PLATFORMS');
      setArticle(result);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg("Failed to generate omnichannel content. Please ensure your API Key is configured or try again.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleRegenerate = async (targetKeyword: string, selectedFormat: ContentFormat, targetStyle?: WritingStyle) => {
    setStatus(GenerationStatus.LOADING);
    const styleToUse = targetStyle || selectedStyle;
    setLoadingFormat(selectedFormat);
    setErrorMsg(null);

    try {
      const result = await generateSEOArticle(targetKeyword, styleToUse, selectedFormat);
      setArticle(result);
      if (targetStyle) {
        setSelectedStyle(targetStyle);
      }
      setStatus(GenerationStatus.SUCCESS);
    } catch (err) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg("Failed to re-generate content. Please verify your connection or try again.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const renderStyleIcon = (id: WritingStyle) => {
    switch (id) {
      case 'ZIGLAR_2026':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'HORMOZI':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'HYBRID_ZIG_HORMOZI':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'THINK_TANK_SEO':
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <Header
        user={googleUser}
        isLoggingIn={isGoogleLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
      />
      
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero / Input Section */}
          <div className="text-center mb-8 mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs font-bold text-yellow-800 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
              <span>Think Tank Digital Content & Sales Suite</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-black mb-3 tracking-tight">
              One Keyword. <span className="text-yellow-500 underline decoration-4 underline-offset-4">Every Digital Platform.</span>
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-6">
              Generate rank-ready SEO blog articles, complete SEO tags, viral LinkedIn & Facebook posts, and TikTok/Reel scripts — powered by Alex Hormozi and modernized Zig Ziglar 2026 sales persuasion.
            </p>

            {/* Writing Style Selection Grid */}
            <div className="max-w-3xl mx-auto mb-6 text-left">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                Select Writing Voice & Persuasion Engine:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {WRITING_STYLES.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-black text-white border-yellow-500 shadow-md scale-[1.02]' 
                          : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 w-full">
                        <div className="p-1.5 rounded-lg bg-gray-100 text-black">
                          {renderStyleIcon(style.id)}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] uppercase font-bold text-yellow-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs tracking-tight leading-snug">
                          {style.name}
                        </h4>
                        <p className={`text-[10px] mt-1 leading-tight line-clamp-2 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          {style.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyword Input Form */}
            <form onSubmit={handleGenerate} className="relative max-w-2xl mx-auto">
              <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-yellow-500 focus-within:ring-4 focus-within:ring-yellow-500/20 transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-44 py-4 text-base md:text-lg bg-white outline-none"
                  placeholder="Enter target keyword (e.g. AI SEO Optimization)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={status === GenerationStatus.LOADING}
                />
                <button
                  type="submit"
                  disabled={!keyword.trim() || status === GenerationStatus.LOADING}
                  className="absolute right-2 top-2 bottom-2 bg-black hover:bg-gray-800 text-white font-extrabold py-2 px-5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {status === GenerationStatus.LOADING ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs">Generating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs md:text-sm">Generate Suite</span>
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
            
            {/* Quick Inspiration Keywords */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-500">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Try:</span>
              {SUGGESTED_KEYWORDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKeyword(k);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-700 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Trust Signals */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>US Grammar Standard</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Zig Ziglar 2026 Sales Engine</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Alex Hormozi No-Fluff Value</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Omnichannel Digital Writes</span>
            </div>
          </div>

          {/* Error State */}
          {status === GenerationStatus.ERROR && errorMsg && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 text-center shadow-sm">
               <p className="font-bold">Generation Encountered an Issue</p>
               <p className="text-sm">{errorMsg}</p>
             </div>
          )}

          {/* Custom Loading State Progress Indicator */}
          {status === GenerationStatus.LOADING && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto my-8 animate-pulse">
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {loadingFormat === 'EBOOK' ? 'Drafting Multi-Chapter eBook...' :
                 loadingFormat === 'SLIDESHOW' ? 'Assembling Visual Slide Presentation...' :
                 loadingFormat === 'SCRIPT' ? 'Directing Teleprompter Video Screenplay...' :
                 loadingFormat === 'TEXT_EDITOR' ? 'Configuring Customizable Template Checklists...' :
                 'Synthesizing Omnichannel Content Suite...'}
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                {selectedStyle === 'ZIGLAR_2026'
                  ? 'Channeling Zig Ziglar in his prime for 2026: transferring conviction, crafting modern parables, and resolving objections (Price vs. Cost)...'
                  : selectedStyle === 'HORMOZI'
                  ? 'Executing Alex Hormozi direct response: calculating value equations, cutting fluff, and structuring Grand Slam offers...'
                  : selectedStyle === 'HYBRID_ZIG_HORMOZI'
                  ? 'Fusing Hormozi value mechanics with Ziglar relational closing psychology for maximum digital conversion...'
                  : 'Structuring high-authority topical depth, E-E-A-T search intent, and Google ranking elements...'}
              </p>
              
              <div className="mt-6 border-t border-gray-100 pt-4 text-xs font-mono text-gray-400">
                Think Tank Digital Engine • US English Grammar • Model: gemini-3.8-flash
              </div>
            </div>
          )}

          {/* Results Section */}
          {status === GenerationStatus.SUCCESS && article && (
            <div className="animate-fade-in-up">
               <ArticleDisplay
                 article={article}
                 onRegenerate={handleRegenerate}
                 googleUser={googleUser}
                 googleAccessToken={googleAccessToken}
                 onGoogleConnect={handleGoogleLogin}
                 isGoogleConnecting={isGoogleLoggingIn}
               />
               
               {/* Think Tank Digital Scale Banner */}
               <div className="mt-12 text-center border-t border-gray-200 pt-8">
                  <div className="inline-block p-1 px-3 bg-yellow-100 text-yellow-900 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                    Think Tank Digital Growth Engine
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Ready to Scale Your Digital Authority?</h3>
                  <p className="text-gray-600 text-sm max-w-lg mx-auto mb-6">
                    Turn high-ranking content into an automated inbound pipeline. Book a free strategy session with the Think Tank Digital team.
                  </p>
                  <a 
                    href="https://thinktankdigital.io/strategy-session" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                  >
                    Book Free Strategy Session
                  </a>
               </div>
            </div>
          )}
          
          {/* Initial Empty State Placeholder */}
          {status === GenerationStatus.IDLE && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white shadow-sm mt-4">
               <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                 ⚡
               </div>
               <h3 className="text-lg font-black text-gray-900 mb-1">Enter a Target Keyword to Deploy</h3>
               <p className="text-gray-500 text-sm max-w-md mx-auto">
                 Instantly generates an SEO blog article, meta tags, schema markup, LinkedIn post, Facebook post, and TikTok/Reel video script.
               </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p className="font-bold text-gray-800">Think Tank Digital SEO Writer</p>
          <p className="mt-1 text-xs text-gray-400">
            A Think Tank Digital product • US English Grammar • Alex Hormozi & Zig Ziglar 2026 Persuasion Architectures
          </p>
          <div className="mt-3 flex justify-center gap-4 text-xs font-semibold text-gray-500">
            <a href="https://thinktankdigital.io/strategy-session" target="_blank" rel="noreferrer" className="hover:text-yellow-600">Strategy Session</a>
            <span>•</span>
            <a href="https://thinktankdigital.io/accelerator" target="_blank" rel="noreferrer" className="hover:text-yellow-600">SEO Accelerator</a>
            <span>•</span>
            <a href="https://thinktankdigital.io/growth-blueprint" target="_blank" rel="noreferrer" className="hover:text-yellow-600">Growth Blueprint</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;