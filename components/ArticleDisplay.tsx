import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedArticle, ContentFormat, WritingStyle } from '../types';
import { 
  FileText, BookOpen, Presentation, Video, Edit3, 
  Copy, Check, ChevronRight, ChevronLeft, Download, Eye, Sparkles, 
  FileCode, Printer, HelpCircle, ExternalLink, Tag,
  Flame, Zap, Crown, ShieldCheck, Share2, Layers
} from 'lucide-react';

const LinkedInIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.95 0-1.72-.78-1.72-1.73s.77-1.73 1.72-1.73 1.73.78 1.73 1.73-.78 1.73-1.73 1.73m1.39 9.74v-8.37H5.07v8.37h2.78Z"/>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
import { 
  listDriveFiles, uploadFileToDrive, createGoogleDoc, 
  createGoogleSheetSEOPlanner, appendRowToGoogleSheet, sendGmailMessage 
} from '../services/workspaceService';
import { WRITING_STYLES } from '../constants';

interface ArticleDisplayProps {
  article: GeneratedArticle;
  onRegenerate: (keyword: string, format: ContentFormat, style?: WritingStyle) => void;
  googleUser: any;
  googleAccessToken: string | null;
  onGoogleConnect: () => void;
  isGoogleConnecting: boolean;
}

type ActiveChannelTab = 'blog' | 'seo_tags' | 'linkedin' | 'facebook' | 'tiktok_reel' | 'twitter_thread' | 'editor' | 'workspace';

const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ 
  article, 
  onRegenerate,
  googleUser,
  googleAccessToken,
  onGoogleConnect,
  isGoogleConnecting
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<ActiveChannelTab>('blog');
  
  // Local editable content state
  const [editedContent, setEditedContent] = useState(article.content);
  
  // UI Format States for Slide/Scene decks
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Remix selectors
  const [remixFormat, setRemixFormat] = useState<ContentFormat>(article.format || 'ALL_PLATFORMS');
  const [remixStyle, setRemixStyle] = useState<WritingStyle>(article.style || 'ZIGLAR_2026');

  // Sync edits when article content updates from regeneration
  useEffect(() => {
    setEditedContent(article.content);
    setCurrentSlideIndex(0);
    setCurrentSceneIndex(0);
    setRemixFormat(article.format || 'ALL_PLATFORMS');
    setRemixStyle(article.style || 'ZIGLAR_2026');

    // Default to the appropriate tab depending on format
    if (article.format === 'LINKEDIN') setActiveChannel('linkedin');
    else if (article.format === 'FACEBOOK') setActiveChannel('facebook');
    else if (article.format === 'TIKTOK_REEL') setActiveChannel('tiktok_reel');
    else if (article.format === 'TWITTER_THREAD') setActiveChannel('twitter_thread');
    else if (article.format === 'SEO_TAGS') setActiveChannel('seo_tags');
    else if (article.format === 'TEXT_EDITOR') setActiveChannel('editor');
    else setActiveChannel('blog');
  }, [article]);

  const copyToClipboard = (text: string, sectionKey: string = 'general') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- GOOGLE WORKSPACE STATES & TRIGGERS ---
  const [driveActionStatus, setDriveActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [driveResultUrl, setDriveResultUrl] = useState<string | null>(null);
  const [driveErrorMsg, setDriveErrorMsg] = useState<string | null>(null);

  const [docActionStatus, setDocActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [docResultUrl, setDocResultUrl] = useState<string | null>(null);
  const [docErrorMsg, setDocErrorMsg] = useState<string | null>(null);

  const [sheetActionStatus, setSheetActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [plannerSpreadsheetId, setPlannerSpreadsheetId] = useState<string>('');
  const [sheetResultUrl, setSheetResultUrl] = useState<string | null>(null);
  const [sheetErrorMsg, setSheetErrorMsg] = useState<string | null>(null);

  const [gmailRecipient, setGmailRecipient] = useState<string>('');
  const [gmailSubject, setGmailSubject] = useState<string>(`Think Tank Digital Content: ${article.title}`);
  const [gmailActionStatus, setGmailActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gmailErrorMsg, setGmailErrorMsg] = useState<string | null>(null);
  const [gmailConfirmed, setGmailConfirmed] = useState<boolean>(false);

  // Active files listed from Drive Browser
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveFilesLoading, setDriveFilesLoading] = useState<boolean>(false);
  const [driveFilesError, setDriveFilesError] = useState<string | null>(null);

  useEffect(() => {
    if (activeChannel === 'workspace' && googleAccessToken) {
      handleListDriveFiles();
    }
  }, [activeChannel, googleAccessToken]);

  const handleListDriveFiles = async () => {
    setDriveFilesLoading(true);
    setDriveFilesError(null);
    try {
      const files = await listDriveFiles(googleAccessToken!);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setDriveFilesError("Unable to fetch Drive storage listing. Please check permissions.");
    } finally {
      setDriveFilesLoading(false);
    }
  };

  const handleUploadToDrive = async (formatType: 'MARKDOWN' | 'HTML') => {
    if (!googleAccessToken) return;
    setDriveActionStatus('loading');
    setDriveErrorMsg(null);
    
    const filename = `${article.keyword.toLowerCase().replace(/\s+/g, '_')}_thinktank.${formatType === 'MARKDOWN' ? 'md' : 'html'}`;
    const mimeType = formatType === 'MARKDOWN' ? 'text/markdown' : 'text/html';
    
    let bodyContent = editedContent;
    if (formatType === 'HTML') {
      bodyContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${article.title}</title>
  <style>
    body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #111; max-width: 800px; margin: auto; }
    h1 { font-size: 2.25rem; font-weight: 800; border-bottom: 3px solid #eab308; padding-bottom: 12px; }
    p { margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <p><strong>Keyword:</strong> ${article.keyword}</p>
  <hr/>
  <div>${editedContent.replace(/\n/g, '<br/>')}</div>
</body>
</html>`;
    }

    try {
      const file = await uploadFileToDrive(googleAccessToken, filename, mimeType, bodyContent);
      setDriveResultUrl(file.webViewLink || '#');
      setDriveActionStatus('success');
      handleListDriveFiles();
    } catch (err: any) {
      console.error(err);
      setDriveErrorMsg(err.message || 'Error uploading file.');
      setDriveActionStatus('error');
    }
  };

  const handleCreateGoogleDoc = async () => {
    if (!googleAccessToken) return;
    setDocActionStatus('loading');
    setDocResultUrl(null);
    setDocErrorMsg(null);
    
    try {
      const cleanContent = `Think Tank Digital SEO Asset\nKeyword: ${article.keyword}\nHeadline: ${article.title}\n\n${editedContent}`;
      const doc = await createGoogleDoc(googleAccessToken, `Think Tank Digital: ${article.keyword}`, cleanContent);
      setDocResultUrl(doc.documentUrl);
      setDocActionStatus('success');
      handleListDriveFiles();
    } catch (err: any) {
      console.error(err);
      setDocErrorMsg(err.message || 'Error occurred creating Google Doc.');
      setDocActionStatus('error');
    }
  };

  const handleCreateNewSheetPlanner = async () => {
    if (!googleAccessToken) return;
    setSheetActionStatus('loading');
    setSheetResultUrl(null);
    setSheetErrorMsg(null);
    
    try {
      const sheet = await createGoogleSheetSEOPlanner(googleAccessToken, 'Think Tank Digital Content Planner');
      setPlannerSpreadsheetId(sheet.spreadsheetId);
      setSheetResultUrl(sheet.spreadsheetUrl);
      setSheetActionStatus('success');
      handleListDriveFiles();
    } catch (err: any) {
      console.error(err);
      setSheetErrorMsg(err.message || 'Error occurred setting up spreadsheet.');
      setSheetActionStatus('error');
    }
  };

  const handleAddRowToSheetPlanner = async () => {
    if (!googleAccessToken || !plannerSpreadsheetId) return;
    setSheetActionStatus('loading');
    setSheetErrorMsg(null);
    
    const wordCount = editedContent.split(/\s+/).filter(Boolean).length.toString();
    const creationDate = new Date().toLocaleDateString('en-US');
    const referenceDocUrl = driveResultUrl || docResultUrl || 'Local Mode';

    try {
      await appendRowToGoogleSheet(
        googleAccessToken,
        plannerSpreadsheetId,
        'Think Tank Digital SEO Log',
        [
          article.keyword,
          article.title,
          article.metaDescription || 'None',
          wordCount,
          article.format || 'ARTICLE',
          creationDate,
          referenceDocUrl
        ]
      );
      setSheetActionStatus('success');
      setSheetResultUrl(`https://docs.google.com/spreadsheets/d/${plannerSpreadsheetId}/edit`);
    } catch (err: any) {
      console.error(err);
      setSheetErrorMsg(err.message || 'Error logging entry in Spreadsheet rows.');
      setSheetActionStatus('error');
    }
  };

  const handleSendGmail = async () => {
    if (!googleAccessToken || !gmailRecipient.trim()) return;
    if (!gmailConfirmed) {
      setGmailErrorMsg('Email dispatch aborted. Explicit confirmation is required.');
      return;
    }

    setGmailActionStatus('loading');
    setGmailErrorMsg(null);

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #111;">
        <h2 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #eab308; padding-bottom: 10px;">${article.title}</h2>
        <p style="font-size: 13px; color: #666; font-style: italic;">Think Tank Digital Content & Persuasion Suite (US Grammar).</p>
        
        <div style="background-color: #fefcbf; border: 1px solid #fef08a; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 5px 0; color: #854d0e; font-size: 11px; text-transform: uppercase;">SEO Target Parameters:</h4>
          <p style="margin: 0; font-size: 13px;"><strong>Keyword:</strong> ${article.keyword}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Meta Description:</strong> ${article.metaDescription || 'None'}</p>
        </div>

        <div style="line-height: 1.6; font-size: 14px;">
          ${editedContent.replace(/\n/g, '<br/>')}
        </div>
        
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 25px 0;"/>
        <p style="font-size: 11px; color: #999; font-family: monospace;">Think Tank Digital SEO Writer • US English</p>
      </div>
    `;

    try {
      await sendGmailMessage(googleAccessToken, gmailRecipient, gmailSubject, htmlBody);
      setGmailActionStatus('success');
    } catch (err: any) {
      console.error(err);
      setGmailErrorMsg(err.message || 'Gmail transmission failed.');
      setGmailActionStatus('error');
    }
  };

  const handleCopyCurrent = () => {
    let textToCopy = editedContent;
    if (activeChannel === 'linkedin' && article.platformOutputs?.linkedinPost) {
      textToCopy = article.platformOutputs.linkedinPost;
    } else if (activeChannel === 'facebook' && article.platformOutputs?.facebookPost) {
      textToCopy = article.platformOutputs.facebookPost;
    } else if (activeChannel === 'tiktok_reel' && article.platformOutputs?.tiktokReel) {
      textToCopy = article.platformOutputs.tiktokReel.fullScript || article.platformOutputs.tiktokReel.voiceoverScript;
    } else if (activeChannel === 'twitter_thread' && article.platformOutputs?.twitterThread) {
      textToCopy = article.platformOutputs.twitterThread.join('\n\n---\n\n');
    } else if (activeChannel === 'seo_tags' && article.platformOutputs?.seoTags) {
      const t = article.platformOutputs.seoTags;
      textToCopy = `Meta Title: ${t.metaTitle}\nMeta Description: ${t.metaDescription}\nURL Slug: /${t.urlSlug}\nPrimary Keyword: ${t.primaryKeyword}\nSecondary Keywords: ${t.secondaryKeywords.join(', ')}\nSearch Intent: ${t.searchIntent}\nTarget Audience: ${t.targetAudience}\n\nSchema Markup:\n${t.jsonLdSchema}`;
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([editedContent], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${article.keyword.toLowerCase().replace(/\s+/g, '_')}_thinktank.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Safe Text Editor Toolbar helpers
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditedContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Slideshow representation parser (for SLIDESHOW format)
  const parsedSlides = useMemo(() => {
    const slidesList: Array<{ title: string; bullets: string[]; visual: string; notes: string }> = [];
    const sections = editedContent.split(/(?=# Slide \d+:|Slide \d+:|# Slide \d+)/gi);

    sections.forEach((sect) => {
      const trimmed = sect.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');
      let title = "";
      const bullets: string[] = [];
      let visual = "";
      let notes = "";

      const titleLine = lines[0];
      const titleMatch = titleLine.match(/Slide \d+:\s*(.*)/i) || titleLine.match(/Slide \d+\s*(.*)/i) || [null, titleLine];
      title = (titleMatch[1] || titleLine).replace(/^#+\s*/, '').trim();

      lines.slice(1).forEach((line) => {
        const l = line.trim();
        if (l.startsWith('- ') || l.startsWith('* ') || l.startsWith('• ')) {
          bullets.push(l.replace(/^[-*•]\s*/, ''));
        } else if (l.toLowerCase().startsWith('visual suggestion:') || l.toLowerCase().startsWith('visual:')) {
          visual = l.replace(/^(visual suggestion|visual):\s*/i, '');
        } else if (l.toLowerCase().startsWith('speaker notes:') || l.toLowerCase().startsWith('speaker:') || l.toLowerCase().startsWith('notes:')) {
          notes = l.replace(/^(speaker notes|speaker|notes|narration):\s*/i, '');
        } else if (l && !l.startsWith('#')) {
          if (notes) notes += " " + l;
          else if (visual) visual += " " + l;
          else if (bullets.length > 0) {
            bullets[bullets.length - 1] += " " + l;
          }
        }
      });

      if (title) {
        slidesList.push({
          title,
          bullets: bullets.length > 0 ? bullets : ["Actionable metric-driven strategy."],
          visual: visual || "High-contrast visual analytics chart demonstrating rapid growth.",
          notes: notes || "Focus on the primary outcome. Transfer total conviction with no filler."
        });
      }
    });

    return slidesList;
  }, [editedContent]);

  // Screenplay scene parser (for SCRIPT format)
  const parsedScenes = useMemo(() => {
    const scenesList: Array<{ title: string; visual: string; audio: string; tip: string }> = [];
    const sections = editedContent.split(/(?=# Scene \d+:|Scene \d+:|# Scene \d+)/gi);

    sections.forEach((sect) => {
      const trimmed = sect.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');
      let title = "";
      let visual = "";
      let audio = "";
      let tip = "";

      const titleLine = lines[0];
      const titleMatch = titleLine.match(/Scene \d+:\s*(.*)/i) || titleLine.match(/Scene \d+\s*(.*)/i) || [null, titleLine];
      title = (titleMatch[1] || titleLine).replace(/^#+\s*/, '').trim();

      lines.slice(1).forEach((line) => {
        const l = line.trim();
        if (l.toLowerCase().startsWith('visual:')) {
          visual = l.replace(/^visual:\s*/i, '');
        } else if (l.toLowerCase().startsWith('audio/voiceover:') || l.toLowerCase().startsWith('audio:') || l.toLowerCase().startsWith('voiceover:')) {
          audio = l.replace(/^(audio\/voiceover|audio|voiceover):\s*/i, '');
        } else if (l.toLowerCase().startsWith('engagement tip:') || l.toLowerCase().startsWith('engagement:') || l.toLowerCase().startsWith('tip:')) {
          tip = l.replace(/^(engagement tip|engagement|tip):\s*/i, '');
        } else if (l && !l.startsWith('#')) {
          if (tip) tip += " " + l;
          else if (audio) audio += " " + l;
          else if (visual) visual += " " + l;
        }
      });

      if (title) {
        scenesList.push({
          title,
          visual: visual || "High-velocity cut, bold kinetic text overlay.",
          audio: audio || "Explain the core outcome with immediate punch.",
          tip: tip || "Keep framing changes every 3 seconds to maximize watch time."
        });
      }
    });

    return scenesList;
  }, [editedContent]);

  // General Simple Markdown parser for view mode rendering
  const renderSimpleMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) return <h1 key={index} className="text-3xl md:text-4xl font-black text-gray-900 mb-6 mt-8 tracking-tight">{trimmed.replace('# ', '')}</h1>;
      if (trimmed.startsWith('## ')) return <h2 key={index} className="text-xl md:text-2xl font-bold text-gray-900 mb-4 mt-8 border-l-4 border-yellow-500 pl-4">{trimmed.replace('## ', '')}</h2>;
      if (trimmed.startsWith('### ')) return <h3 key={index} className="text-lg md:text-xl font-bold text-gray-800 mb-3 mt-6">{trimmed.replace('### ', '')}</h3>;
      if (trimmed.startsWith('- ')) return <li key={index} className="ml-6 list-disc mb-2 text-gray-700 font-medium">{trimmed.replace('- ', '')}</li>;
      if (trimmed.match(/^\d+\. /)) return <li key={index} className="ml-6 list-decimal mb-2 text-gray-700 font-medium">{trimmed.replace(/^\d+\. /, '')}</li>;
      if (trimmed === '') return <div key={index} className="h-4"></div>;
      
      // Bold Text parsing (**text**) and Links [alt](url)
      const parts = line.split(/(\*\*.*?\*\*)/);
      const renderedLine = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-extrabold text-black">{part.slice(2, -2)}</strong>;
        }
        
        const linkParts = part.split(/(\[.*?\]\(.*?\))/);
        if (linkParts.length > 1) {
          return linkParts.map((lp, j) => {
            const match = lp.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return <a key={`${i}-${j}`} href={match[2]} target="_blank" rel="noreferrer" className="text-yellow-600 font-bold underline hover:text-yellow-800">{match[1]}</a>;
            }
            return lp;
          });
        }
        return part;
      });

      return <p key={index} className="mb-3 text-gray-700 leading-relaxed font-normal">{renderedLine}</p>;
    });
  };

  const getStyleBadge = (style: WritingStyle) => {
    switch (style) {
      case 'ZIGLAR_2026':
        return { label: 'Zig Ziglar 2026 Persuasion', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> };
      case 'HORMOZI':
        return { label: 'Alex Hormozi $100M Value', icon: <Zap className="w-3.5 h-3.5 text-yellow-500" /> };
      case 'HYBRID_ZIG_HORMOZI':
        return { label: 'Hormozi x Ziglar Fusion', icon: <Crown className="w-3.5 h-3.5 text-yellow-400" /> };
      case 'THINK_TANK_SEO':
        return { label: 'Think Tank Authority SEO', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> };
      default:
        return { label: 'Think Tank Digital Engine', icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> };
    }
  };

  const currentBadge = getStyleBadge(article.style);
  const platformOutputs = article.platformOutputs;

  return (
    <div id="article-display-card" className="w-full max-w-5xl mx-auto mt-6 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      
      {/* Upper Control Bar */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-black text-white p-5 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-yellow-500 text-black px-2.5 py-0.5 rounded-full shadow-sm">
              {currentBadge.icon}
              {currentBadge.label}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase bg-gray-800 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
              US English
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Omnichannel Suite
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Target Keyword: <span className="font-bold text-yellow-400">{article.keyword}</span>
          </p>
        </div>

        {/* Global Action Handlers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyCurrent}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-sm ${
              copied ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black hover:bg-yellow-400'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied View' : 'Copy View'}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
            title="Download Markdown Document"
          >
            <Download className="w-3.5 h-3.5 text-gray-300" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Omnichannel Platform Navigation Tabs */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'blog', label: 'SEO Blog Article', icon: <FileText className="w-4 h-4 text-amber-600" /> },
          { id: 'seo_tags', label: 'SEO Tags & Schema', icon: <Tag className="w-4 h-4 text-blue-600" /> },
          { id: 'linkedin', label: 'LinkedIn Post', icon: <LinkedInIcon className="w-4 h-4 text-sky-600" /> },
          { id: 'facebook', label: 'Facebook Post', icon: <FacebookIcon className="w-4 h-4 text-indigo-600" /> },
          { id: 'tiktok_reel', label: 'TikTok / Reel Script', icon: <Video className="w-4 h-4 text-red-600" /> },
          { id: 'twitter_thread', label: 'X / Twitter Thread', icon: <TwitterXIcon className="w-4 h-4 text-neutral-800" /> },
          { id: 'editor', label: 'Live Editor', icon: <Edit3 className="w-4 h-4 text-emerald-600" /> },
          { id: 'workspace', label: 'Google Workspace Hub', icon: <Sparkles className="w-4 h-4 text-yellow-600" /> },
        ].map((tab) => {
          const isActive = activeChannel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChannel(tab.id as ActiveChannelTab)}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-black rounded-t-xl transition-all whitespace-nowrap cursor-pointer border-t-2 ${
                isActive 
                  ? 'bg-white text-black border-yellow-500 shadow-sm' 
                  : 'text-gray-600 hover:text-black border-transparent hover:bg-gray-200/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="bg-white">

        {/* 1. SEO BLOG ARTICLE TAB */}
        {activeChannel === 'blog' && (
          <div className="p-6 md:p-10">
            {/* Special Formats fallback if user specifically requested SLIDESHOW or SCRIPT */}
            {article.format === 'SLIDESHOW' && parsedSlides.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-gray-900 text-white rounded-2xl shadow-xl overflow-hidden border border-gray-800 flex flex-col">
                  <div className="bg-gray-950 px-4 py-2.5 flex justify-between items-center border-b border-gray-800">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-yellow-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                      Think Tank Digital Deck Player
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      SLIDE {currentSlideIndex + 1} OF {parsedSlides.length}
                    </span>
                  </div>

                  <div className="p-8 md:p-12 min-h-[320px] flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-950">
                    <div className="my-auto space-y-5">
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight border-b border-gray-800 pb-3">
                        {parsedSlides[currentSlideIndex].title}
                      </h3>
                      <ul className="space-y-3">
                        {parsedSlides[currentSlideIndex].bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-gray-200 text-sm md:text-base font-semibold">
                            <span className="text-yellow-400 mt-1 font-bold">●</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-yellow-400">Visual Cue:</span>
                      <p className="text-[11px] text-gray-400 italic truncate">
                        {parsedSlides[currentSlideIndex].visual}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-3 px-6 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                      className="p-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="flex items-center gap-1.5">
                      {parsedSlides.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={() => setCurrentSlideIndex(dotIdx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            currentSlideIndex === dotIdx ? 'bg-yellow-400 scale-125' : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.min(parsedSlides.length - 1, prev + 1))}
                      disabled={currentSlideIndex === parsedSlides.length - 1}
                      className="p-1.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl">
                  <h4 className="text-yellow-950 font-black text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    Speaker Notes & Delivery Coaching
                  </h4>
                  <p className="text-sm text-gray-800 leading-relaxed font-semibold italic">
                    "{parsedSlides[currentSlideIndex].notes}"
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Meta Description Preview Strip */}
                {article.metaDescription && (
                  <div className="bg-yellow-50/70 border border-yellow-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-yellow-900 block mb-0.5">
                        SERP Meta Description (US English)
                      </span>
                      <p className="text-xs text-gray-800 font-medium italic">
                        "{article.metaDescription}"
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white border border-yellow-300 text-yellow-900 px-2 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                      {article.metaDescription.length} / 155 chars
                    </span>
                  </div>
                )}

                {/* Rendered Blog Markdown */}
                <div className="prose prose-lg max-w-none prose-headings:font-black">
                  {renderSimpleMarkdown(platformOutputs?.blogArticle.content || editedContent)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SEO TAGS & SCHEMA TAB */}
        {activeChannel === 'seo_tags' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">SEO Tags & Schema Inspector</h3>
                <p className="text-xs text-gray-500">
                  Ready-to-deploy metadata, canonical slug, LSI keywords, and JSON-LD structured data.
                </p>
              </div>
              <button
                onClick={() => {
                  const s = platformOutputs?.seoTags;
                  if (!s) return;
                  const allTags = `Title: ${s.metaTitle}\nDescription: ${s.metaDescription}\nSlug: /${s.urlSlug}\nKeywords: ${s.secondaryKeywords.join(', ')}\nSchema:\n${s.jsonLdSchema}`;
                  copyToClipboard(allTags, 'all_seo');
                }}
                className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSection === 'all_seo' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'all_seo' ? 'Copied' : 'Copy All Tags'}</span>
              </button>
            </div>

            {/* Google SERP Snippet Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-gray-400 block mb-2">
                Google Search Result Preview
              </span>
              <div className="space-y-1">
                <span className="text-xs text-gray-600 block">
                  https://yourdomain.com/{platformOutputs?.seoTags.urlSlug || article.keyword.toLowerCase().replace(/\s+/g, '-')}
                </span>
                <h4 className="text-lg font-bold text-blue-700 hover:underline cursor-pointer leading-tight">
                  {platformOutputs?.seoTags.metaTitle || `${article.keyword} | Think Tank Digital`}
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {platformOutputs?.seoTags.metaDescription || article.metaDescription}
                </p>
              </div>
            </div>

            {/* Key Metadata Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Title */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">Page Title</span>
                  <button
                    onClick={() => copyToClipboard(platformOutputs?.seoTags.metaTitle || article.title, 'title')}
                    className="text-xs text-yellow-600 font-bold hover:text-yellow-700 flex items-center gap-1"
                  >
                    {copiedSection === 'title' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'title' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-900">{platformOutputs?.seoTags.metaTitle || article.title}</p>
                <span className="text-[10px] font-mono text-gray-400 block">
                  {(platformOutputs?.seoTags.metaTitle || article.title).length} / 60 characters
                </span>
              </div>

              {/* URL Slug */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">Target URL Slug</span>
                  <button
                    onClick={() => copyToClipboard(`/${platformOutputs?.seoTags.urlSlug || article.keyword.toLowerCase().replace(/\s+/g, '-')}`, 'slug')}
                    className="text-xs text-yellow-600 font-bold hover:text-yellow-700 flex items-center gap-1"
                  >
                    {copiedSection === 'slug' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'slug' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-150">
                  /{platformOutputs?.seoTags.urlSlug || article.keyword.toLowerCase().replace(/\s+/g, '-')}
                </p>
                <span className="text-[10px] text-gray-400">Clean canonical permalink</span>
              </div>

              {/* Primary & Secondary Keywords */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                  Target & Semantic LSI Keywords
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-yellow-500 text-black font-extrabold text-xs rounded-lg flex items-center gap-1">
                    ★ {platformOutputs?.seoTags.primaryKeyword || article.keyword} (Primary)
                  </span>
                  {(platformOutputs?.seoTags.secondaryKeywords || []).map((sec, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-800 font-semibold text-xs rounded-lg border border-gray-200">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Search Intent & Persona */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">Search Intent</span>
                <p className="text-xs font-bold text-gray-900">{platformOutputs?.seoTags.searchIntent || 'Commercial Investigation & Problem Solving'}</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">Target Persona</span>
                <p className="text-xs font-bold text-gray-900">{platformOutputs?.seoTags.targetAudience || 'Digital marketers, business founders, and revenue operators'}</p>
              </div>
            </div>

            {/* JSON-LD Schema Markup */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-950 text-gray-100">
              <div className="bg-gray-900 px-4 py-2.5 flex justify-between items-center border-b border-gray-800">
                <span className="text-xs font-mono font-bold text-yellow-400">JSON-LD Structured Data Schema</span>
                <button
                  onClick={() => copyToClipboard(platformOutputs?.seoTags.jsonLdSchema || '{}', 'schema')}
                  className="px-2.5 py-1 bg-yellow-500 text-black hover:bg-yellow-400 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'schema' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-[260px] leading-relaxed">
                {platformOutputs?.seoTags.jsonLdSchema || JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  "headline": article.title,
                  "keyword": article.keyword,
                  "publisher": { "@type": "Organization", "name": "Think Tank Digital" }
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 3. LINKEDIN POST TAB */}
        {activeChannel === 'linkedin' && (
          <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  LinkedIn Authority Post
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">Ready for High-Engagement Feed Post</h3>
              </div>
              <button
                onClick={() => copyToClipboard(platformOutputs?.linkedinPost || '', 'linkedin')}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {copiedSection === 'linkedin' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'linkedin' ? 'Copied Post' : 'Copy Post'}</span>
              </button>
            </div>

            {/* LinkedIn Card Mockup */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-md p-5 space-y-4">
              {/* Header profile */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-sm">
                  TT
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-950 leading-tight">Think Tank Digital</h4>
                  <p className="text-[11px] text-gray-500">Omnichannel Growth & Authority • 1st</p>
                  <span className="text-[10px] text-gray-400">Just now • 🌐</span>
                </div>
              </div>

              {/* Post Text */}
              <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-normal">
                {platformOutputs?.linkedinPost || "Generating high-impact LinkedIn post..."}
              </div>

              {/* Reactions mockup */}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-gray-500 text-xs font-bold">
                <span className="hover:text-sky-600 cursor-pointer">👍 Like</span>
                <span className="hover:text-sky-600 cursor-pointer">💬 Comment</span>
                <span className="hover:text-sky-600 cursor-pointer">🔄 Repost</span>
                <span className="hover:text-sky-600 cursor-pointer">📤 Send</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. FACEBOOK POST TAB */}
        {activeChannel === 'facebook' && (
          <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Facebook Community Post
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">Story-Driven Persuasion Write</h3>
              </div>
              <button
                onClick={() => copyToClipboard(platformOutputs?.facebookPost || '', 'facebook')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {copiedSection === 'facebook' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'facebook' ? 'Copied Post' : 'Copy Post'}</span>
              </button>
            </div>

            {/* Facebook Card Mockup */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  f
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Think Tank Digital Community</h4>
                  <p className="text-[11px] text-gray-400">Public group • Just now</p>
                </div>
              </div>

              <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {platformOutputs?.facebookPost || "Generating story-driven Facebook post..."}
              </div>

              <div className="border-t border-gray-100 pt-2 flex justify-around text-gray-500 text-xs font-bold">
                <span>❤️ Like</span>
                <span>💬 Comment</span>
                <span>↗ Share</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. TIKTOK / REEL SCRIPT TAB */}
        {activeChannel === 'tiktok_reel' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  TikTok / Reels / Shorts Screenplay
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">30-60s High Retention Video Blueprint</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(platformOutputs?.tiktokReel?.voiceoverScript || '', 'voiceover')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg border border-gray-300 transition-all cursor-pointer"
                >
                  {copiedSection === 'voiceover' ? 'Copied Audio' : 'Copy Voiceover Only'}
                </button>
                <button
                  onClick={() => copyToClipboard(platformOutputs?.tiktokReel?.fullScript || '', 'tiktok_all')}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copiedSection === 'tiktok_all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tiktok_all' ? 'Copied Script' : 'Copy Full Script'}</span>
                </button>
              </div>
            </div>

            {/* Hook Callout Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800 block">
                  ⚡ 0:00 - 0:03 Spoken Hook
                </span>
                <p className="text-sm font-extrabold text-red-950 italic">
                  "{platformOutputs?.tiktokReel?.hook || `Stop making this huge mistake with ${article.keyword}!`}"
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  📺 On-Screen Text Graphic
                </span>
                <p className="text-sm font-black text-gray-950 uppercase tracking-tight">
                  {platformOutputs?.tiktokReel?.onScreenText || `${article.keyword} in 2026 🚨`}
                </p>
              </div>
            </div>

            {/* Duplex Visual & Audio Teleprompter Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Visual Directions */}
                <div className="p-5 bg-gray-50 space-y-3">
                  <span className="text-xs font-mono font-black uppercase text-gray-500">
                    🎬 Creator & Visual Directions
                  </span>
                  <div className="text-sm text-gray-800 leading-relaxed font-semibold bg-white p-4 rounded-xl border border-gray-200">
                    {platformOutputs?.tiktokReel?.visualDirection || "Point at on-screen text, quick zoom in on hook statement, rapid cuts."}
                  </div>
                  <p className="text-[11px] text-gray-400 italic">
                    Tip: Keep frame transitions under 3 seconds to preserve retention graph.
                  </p>
                </div>

                {/* Spoken Voiceover */}
                <div className="p-5 bg-white space-y-3">
                  <span className="text-xs font-mono font-black uppercase text-gray-500">
                    🎙️ Spoken Voiceover Script (30-60s)
                  </span>
                  <div className="text-sm text-gray-900 leading-relaxed font-medium whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {platformOutputs?.tiktokReel?.voiceoverScript || platformOutputs?.tiktokReel?.fullScript}
                  </div>
                </div>
              </div>

              {/* Call to Action & Pinned Comment */}
              <div className="bg-gray-900 text-white p-4 px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-mono text-yellow-400 uppercase font-black">Spoken CTA:</span>
                  <p className="text-xs font-bold text-gray-200">{platformOutputs?.tiktokReel?.callToAction || "Follow for more!"}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-mono text-yellow-400 uppercase font-black">Pinned Comment:</span>
                  <p className="text-xs font-bold text-gray-200">{platformOutputs?.tiktokReel?.pinnedComment || "Get the full breakdown in our bio link 🚀"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. X / TWITTER THREAD TAB */}
        {activeChannel === 'twitter_thread' && (
          <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-800 bg-gray-100 border border-gray-300 px-2.5 py-0.5 rounded-full">
                  X / Twitter Thread
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">Viral 8-Tweet Breakdown</h3>
              </div>
              <button
                onClick={() => copyToClipboard((platformOutputs?.twitterThread || []).join('\n\n---\n\n'), 'all_tweets')}
                className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSection === 'all_tweets' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'all_tweets' ? 'Copied Thread' : 'Copy All Tweets'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {(platformOutputs?.twitterThread || []).map((tweet, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group hover:border-gray-400 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-mono font-bold text-gray-400">Tweet {idx + 1} of {(platformOutputs?.twitterThread || []).length}</span>
                    <button
                      onClick={() => copyToClipboard(tweet, `tweet_${idx}`)}
                      className="text-gray-400 hover:text-black p-1 rounded transition-all cursor-pointer"
                      title="Copy Tweet"
                    >
                      {copiedSection === `tweet_${idx}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{tweet}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. LIVE EDITOR TAB */}
        {activeChannel === 'editor' && (
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Live Markdown Editor</h3>
                <p className="text-xs text-gray-500">Fine-tune copy, insert custom brand parameters, and export.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded"
                >
                  B
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-xs italic rounded"
                >
                  I
                </button>
                <button
                  onClick={() => insertMarkdown('## ')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded"
                >
                  H2
                </button>
                <button
                  onClick={() => insertMarkdown('- ')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded"
                >
                  List
                </button>
                <button
                  onClick={() => copyToClipboard(editedContent, 'editor_raw')}
                  className="px-3 py-1 bg-black text-white text-xs font-bold rounded ml-2"
                >
                  {copiedSection === 'editor_raw' ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>

            <textarea
              id="markdown-editor-textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[460px] p-4 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-yellow-500 outline-none leading-relaxed resize-y"
            />
            <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
              <span>Words: {editedContent.split(/\s+/).filter(Boolean).length}</span>
              <span>Characters: {editedContent.length}</span>
            </div>
          </div>
        )}

        {/* 8. GOOGLE WORKSPACE HUB TAB */}
        {activeChannel === 'workspace' && (
          <div className="p-6 md:p-8 space-y-6">
            {!googleAccessToken ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-md">
                  ⚡
                </div>
                <h3 className="text-xl font-black text-gray-900">Connect Google Workspace</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                  Authorize your Google Account to export articles directly to Google Docs, log content plans into Google Sheets, save backups to Google Drive, and dispatch briefs via Gmail.
                </p>
                <button
                  onClick={onGoogleConnect}
                  disabled={isGoogleConnecting}
                  className="bg-black hover:bg-gray-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  {isGoogleConnecting ? 'Connecting to Google...' : 'Authorize Google Account'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Google Docs Export */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mb-2">
                        DOC
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">Google Docs</h4>
                      <p className="text-xs text-gray-500 mt-1">Export formatted document directly to your Google Drive.</p>
                    </div>
                    <div>
                      {docResultUrl && (
                        <a href={docResultUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline font-bold block mb-2">
                          Open Created Doc ↗
                        </a>
                      )}
                      <button
                        onClick={handleCreateGoogleDoc}
                        disabled={docActionStatus === 'loading'}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        {docActionStatus === 'loading' ? 'Exporting...' : 'Create Google Doc'}
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets Planner */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                        SHEET
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">SEO Content Planner</h4>
                      <p className="text-xs text-gray-500 mt-1">Set up or log keyword stats into a tracking spreadsheet.</p>
                    </div>
                    <div className="space-y-2">
                      {sheetResultUrl && (
                        <a href={sheetResultUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline font-bold block">
                          Open Spreadsheet ↗
                        </a>
                      )}
                      {!plannerSpreadsheetId ? (
                        <button
                          onClick={handleCreateNewSheetPlanner}
                          disabled={sheetActionStatus === 'loading'}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {sheetActionStatus === 'loading' ? 'Creating...' : 'Initialize Sheet Planner'}
                        </button>
                      ) : (
                        <button
                          onClick={handleAddRowToSheetPlanner}
                          disabled={sheetActionStatus === 'loading'}
                          className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {sheetActionStatus === 'loading' ? 'Logging...' : 'Log Keyword to Sheet'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Google Drive Upload */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mb-2">
                        DRIVE
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">Google Drive Upload</h4>
                      <p className="text-xs text-gray-500 mt-1">Store Markdown or styled HTML file in root Drive storage.</p>
                    </div>
                    <div>
                      {driveResultUrl && (
                        <a href={driveResultUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-600 underline font-bold block mb-2">
                          View in Drive ↗
                        </a>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUploadToDrive('MARKDOWN')}
                          disabled={driveActionStatus === 'loading'}
                          className="py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Upload .MD
                        </button>
                        <button
                          onClick={() => handleUploadToDrive('HTML')}
                          disabled={driveActionStatus === 'loading'}
                          className="py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Upload HTML
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gmail Dispatch Drawer */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                  <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                    <span>✉️</span> Dispatch Copy Brief via Gmail
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Recipient Email (e.g. client@agency.com)"
                      value={gmailRecipient}
                      onChange={(e) => setGmailRecipient(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Subject Line"
                      value={gmailSubject}
                      onChange={(e) => setGmailSubject(e.target.value)}
                      className="p-2.5 text-xs bg-white border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gmailConfirmed}
                        onChange={(e) => setGmailConfirmed(e.target.checked)}
                        className="rounded"
                      />
                      <span>I confirm dispatching this email brief to the recipient.</span>
                    </label>
                    <button
                      onClick={handleSendGmail}
                      disabled={gmailActionStatus === 'loading' || !gmailConfirmed || !gmailRecipient.trim()}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-extrabold text-xs rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {gmailActionStatus === 'loading' ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                  {gmailActionStatus === 'success' && (
                    <p className="text-xs text-green-600 font-bold">✓ Email dispatched successfully via Gmail API!</p>
                  )}
                  {gmailErrorMsg && (
                    <p className="text-xs text-red-500 font-bold">{gmailErrorMsg}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER ACTION: THE THINK TANK DIGITAL REMIX & PERSUASION ENGINE */}
      <div className="bg-gray-950 p-6 md:p-8 text-white border-t border-gray-800">
        <div className="max-w-xl mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 bg-yellow-500 rounded-lg text-black">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Think Tank Digital Remix Engine
            </h3>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Switch style personas or regenerate into standalone eBooks, presentation pitch decks, or interactive templates.
          </p>
        </div>

        {/* Style Selector Pills in Remix */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block mb-2">Writing Persona / Voice:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WRITING_STYLES.map((st) => (
              <button
                key={st.id}
                onClick={() => setRemixStyle(st.id)}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                  remixStyle === st.id
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-sm'
                    : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="truncate">{st.name}</div>
                <div className={`text-[9px] font-normal truncate ${remixStyle === st.id ? 'text-gray-800' : 'text-gray-500'}`}>
                  {st.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector Pills */}
        <div className="mb-5">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block mb-2">Target Output Format:</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'ALL_PLATFORMS', name: 'Omnichannel Suite', badge: 'All Platforms' },
              { id: 'EBOOK', name: 'PDF eBook', badge: 'Chapters' },
              { id: 'SLIDESHOW', name: 'Slide Deck', badge: 'Visuals' },
              { id: 'SCRIPT', name: 'Video Script', badge: 'Scenes' },
              { id: 'TEXT_EDITOR', name: 'Interactive Template', badge: 'Checklists' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setRemixFormat(fmt.id as ContentFormat)}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                  remixFormat === fmt.id
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="truncate">{fmt.name}</div>
                <div className={`text-[9px] font-normal truncate ${remixFormat === fmt.id ? 'text-gray-600' : 'text-gray-500'}`}>
                  {fmt.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 gap-3">
          <div className="text-xs text-gray-400">
            Re-synthesize for <span className="text-yellow-400 font-bold">"{article.keyword}"</span> with the selected persona and structure.
          </div>
          <button
            onClick={() => onRegenerate(article.keyword, remixFormat, remixStyle)}
            className="w-full sm:w-auto px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/20"
          >
            Deploy Remix
          </button>
        </div>
      </div>

    </div>
  );
};

export default ArticleDisplay;
