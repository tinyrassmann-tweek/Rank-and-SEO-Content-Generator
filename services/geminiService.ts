import { GoogleGenAI } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION, STYLE_DIRECTIVES } from "../constants";
import { GeneratedArticle, ContentFormat, WritingStyle, PlatformOutputs, SEOTags, TikTokReelScript } from "../types";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("API_KEY is missing from environment variables. The app will not function correctly without it.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || 'DUMMY_KEY_FOR_BUILD',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to sanitize JSON from Markdown code fences
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export const generateSEOArticle = async (
  keyword: string,
  style: WritingStyle = 'ZIGLAR_2026',
  format: ContentFormat = 'ALL_PLATFORMS'
): Promise<GeneratedArticle> => {
  try {
    const styleInstruction = STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES.ZIGLAR_2026;
    const combinedSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${styleInstruction}`;

    // For specific standalone document formats (eBook, Slideshow, Script, Text Editor)
    if (format === 'EBOOK') {
      const ebookPrompt = `Write a comprehensive, publication-ready digital eBook about "${keyword}".
Adhere strictly to US Grammar (e.g., 'optimize', 'program', 'analyze').
Style Persona:
${styleInstruction}

Structure as pure Markdown:
# [Catchy High-Impact eBook Title]
## Executive Summary & Target Audience
## Table of Contents
## Chapter 1: The Harsh Reality & Why Old Methods Fail
(Include punchy subheadings, bullet checklists, and modern parables or value equations)
## Chapter 2: The Core Strategic Framework
(Include step-by-step implementation, bold metrics, and actionable blueprints)
## Chapter 3: Mastering Execution in 2026
(Include objection handling, the Price vs. Cost dynamic, and relational persuasion)
## Key Takeaways & Action Checklist
## Final Call to Action
(Weave in Think Tank Strategy Session: https://thinktankdigital.io/strategy-session)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: ebookPrompt,
        config: {
          systemInstruction: combinedSystemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "";
      const lines = text.split('\n');
      const h1Line = lines.find(l => l.startsWith('# '));
      const title = h1Line ? h1Line.replace('# ', '').trim() : `eBook: ${keyword}`;

      return {
        title,
        content: text,
        metaDescription: `Master ${keyword} with Think Tank Digital's comprehensive guide. Actionable frameworks, modern persuasion, and results-driven strategies.`,
        keyword,
        format,
        style
      };
    }

    if (format === 'SLIDESHOW') {
      const slidePrompt = `Create a high-converting, 6-slide presentation deck for "${keyword}".
Adhere strictly to US Grammar.
Style Persona:
${styleInstruction}

Structure in pure Markdown with 6 slides using this exact block format for each slide:

# Slide [X]: [Slide Headline]
- Key Bullet Point 1
- Key Bullet Point 2
- Key Bullet Point 3
Visual Suggestion: [Detailed description of graphic, diagram, or backdrop]
Speaker Notes: [What the presenter speaks to keep the room captivated. Use high-conviction storytelling, transference of feeling, or Hormozi value math.]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: slidePrompt,
        config: {
          systemInstruction: combinedSystemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "";
      const lines = text.split('\n');
      const h1Line = lines.find(l => l.startsWith('# Slide 1:'));
      const title = h1Line ? h1Line.replace('# Slide 1:', '').trim() : `Slide Deck: ${keyword}`;

      return {
        title: `Slide Deck: ${title}`,
        content: text,
        metaDescription: `High-impact slide presentation on ${keyword}. Modern sales persuasion, visual frameworks, and high-retention speaker notes.`,
        keyword,
        format,
        style
      };
    }

    if (format === 'SCRIPT') {
      const scriptPrompt = `Create a high-retention video script (YouTube, Short, or Video Sales Letter) for "${keyword}".
Adhere strictly to US Grammar.
Style Persona:
${styleInstruction}

Structure in pure Markdown with 5 scenes using this exact block format:

# Scene [X]: [Hook / Scene Purpose]
Visual: [Camera angle, B-roll suggestion, text-on-screen graphic]
Audio/Voiceover: [Exact words spoken. Direct, energetic, charismatic, zero fluff.]
Engagement Tip: [Retention tactic to keep viewers from dropping off]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: scriptPrompt,
        config: {
          systemInstruction: combinedSystemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "";
      return {
        title: `Video Script: ${keyword}`,
        content: text,
        metaDescription: `High-retention video screenplay for ${keyword}. Designed with visual directions, engaging retention hooks, and high-converting calls to action.`,
        keyword,
        format,
        style
      };
    }

    if (format === 'TEXT_EDITOR') {
      const editorPrompt = `Create an interactive, customizable content and strategy template for "${keyword}".
Include editable brackets like [INSERT YOUR COMPANY NAME], [PRIMARY GOAL], [MONTHLY BUDGET: $2,500 / $5,000 / $10,000], [TARGET AUDIENCE].
Provide actionable checklists, workflow steps, and resources. Strictly US Grammar.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: editorPrompt,
        config: {
          systemInstruction: combinedSystemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "";
      return {
        title: `Customizable Draft: ${keyword}`,
        content: text,
        metaDescription: `Interactive SEO and sales template for ${keyword}. Ready to customize with fillable brackets and execution checklists.`,
        keyword,
        format,
        style
      };
    }

    // PRIMARY OMNICHANNEL GENERATION (ALL_PLATFORMS, ARTICLE, SEO_TAGS, LINKEDIN, FACEBOOK, TIKTOK_REEL, TWITTER_THREAD)
    const omnichannelPrompt = `
Generate a comprehensive, omnichannel digital content suite for the target keyword: "${keyword}".
Strictly follow US Grammar and spelling rules.

STYLE DIRECTIVE:
${styleInstruction}

You MUST return a valid, parseable JSON object matching this exact structure:
{
  "blogArticle": {
    "title": "A captivating, high-CTR H1 Title containing '${keyword}'",
    "content": "A complete, high-ranking SEO article in Markdown format. Requirements:\\n- Primary keyword in first 100 words and final concluding paragraph.\\n- At least 3 H2 and H3 subheadings with actionable breakdowns.\\n- Bold takeaways, numbered lists, bullet points.\\n- Frequently Asked Questions (FAQ) section with 3 questions and direct answers.\\n- Weave in Think Tank Strategy Session (https://thinktankdigital.io/strategy-session) and Think Tank SEO Accelerator (https://thinktankdigital.io/accelerator) organically.\\n- Written in the chosen style (${style})."
  },
  "seoTags": {
    "metaTitle": "Under 60 chars. Punchy, high-CTR title with '${keyword}'",
    "metaDescription": "Under 155 chars. Strictly US spelling. High benefit, click-worthy, includes '${keyword}'",
    "urlSlug": "clean-keyword-slug",
    "primaryKeyword": "${keyword}",
    "secondaryKeywords": ["semantic keyword 1", "semantic keyword 2", "semantic keyword 3", "semantic keyword 4"],
    "searchIntent": "Commercial Investigation & Transactional",
    "targetAudience": "Specific buyer persona description",
    "jsonLdSchema": "{\\n  \\\"@context\\\": \\\"https://schema.org\\\",\\n  \\\"@type\\\": \\\"Article\\\",\\n  \\\"headline\\\": \\\"...\\\",\\n  \\\"description\\\": \\\"...\\\",\\n  \\\"mainEntityOfPage\\\": {\\\"@type\\\": \\\"WebPage\\\"},\\n  \\\"publisher\\\": {\\\"@type\\\": \\\"Organization\\\", \\\"name\\\": \\\"Think Tank Digital\\\"}\\n}"
  },
  "linkedinPost": "A scroll-stopping viral LinkedIn post. Format:\\n- Line 1: Ultra-compelling 1-line hook (creates curiosity gap)\\n- Short 1-2 sentence lines with line breaks\\n- The core framework or story-selling insight\\n- High-engagement conversation question / CTA\\n- 3 to 5 relevant hashtags (#SEO #DigitalMarketing #Growth #Sales)",
  "facebookPost": "A warm, story-driven Facebook post. Conversational opening, emotional resonance (Ziglar transference of feeling or relatable lesson), valuable takeaway, and an invitation to comment or share.",
  "tiktokReel": {
    "hook": "0:00-0:03 Spoken high-voltage hook that stops scrolling thumbs immediately",
    "onScreenText": "Bold text overlay for screen in first 3 seconds",
    "visualDirection": "Action visual instruction for the creator/editor (camera angle, movement)",
    "voiceoverScript": "Full spoken voiceover script (30-60s) with rapid-fire delivery and conversational conviction",
    "callToAction": "Clear verbal next step command",
    "pinnedComment": "High-converting strategic comment to pin at the top of the video",
    "fullScript": "# TikTok/Reel Script: ${keyword}\\n**Visual Hook:** ...\\n**Audio Hook:** ...\\n\\n**Scene 1 [0:03-0:15]:** ...\\n**Scene 2 [0:15-0:35]:** ...\\n**Scene 3 [0:35-0:50]:** ...\\n**Closing CTA [0:50-0:60]:** ..."
  },
  "twitterThread": [
    "Tweet 1: High curiosity hook with a bold claim or framework promise.",
    "Tweet 2: The problem most people make with ${keyword}.",
    "Tweet 3: Step 1 of the high-leverage solution.",
    "Tweet 4: Step 2 with tactical examples.",
    "Tweet 5: The unexpected mindset shift (Ziglar/Hormozi angle).",
    "Tweet 6: Key takeaway recap.",
    "Tweet 7: Bookmark & Retweet CTA.",
    "Tweet 8: Final call to action to connect with Think Tank Digital."
  ]
}

DO NOT include any conversational preamble. Return ONLY the valid JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: omnichannelPrompt,
      config: {
        systemInstruction: combinedSystemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const rawText = response.text || "";
    let parsedData: any = null;

    try {
      parsedData = JSON.parse(cleanJsonString(rawText));
    } catch (parseErr) {
      console.warn("JSON parsing failed, attempting fallback regex extraction:", parseErr);
      // Fallback: create basic object from text
      parsedData = {
        blogArticle: {
          title: `Think Tank Digital Guide: ${keyword}`,
          content: rawText
        },
        seoTags: {
          metaTitle: `${keyword.slice(0, 45)} | Think Tank Digital`,
          metaDescription: `Discover high-impact strategies for ${keyword}. Optimized for organic search and conversion by Think Tank Digital.`,
          urlSlug: keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          primaryKeyword: keyword,
          secondaryKeywords: [`${keyword} strategy`, `${keyword} tips`, `${keyword} guide`, `best ${keyword}`],
          searchIntent: "Commercial & Informational",
          targetAudience: "Digital marketers, entrepreneurs, and revenue leaders",
          jsonLdSchema: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `High Impact Strategies for ${keyword}`,
            "publisher": { "@type": "Organization", "name": "Think Tank Digital" }
          }, null, 2)
        },
        linkedinPost: `Most people get ${keyword} completely backwards.\n\nHere is what the top 1% do instead:\n\n1. Focus on value before asking for the sale.\n2. Prime the pump before expecting the torrent.\n3. Build on owned authority, not rented algorithms.\n\nWhat is your biggest roadblock with ${keyword}? Drop a comment below.\n\n#SEO #Marketing #ThinkTankDigital`,
        facebookPost: `Let's talk about ${keyword} for a second.\n\nA mentor once told me: "You can have everything in life you want, if you just help enough other people get what they want."\n\nWhen you approach your marketing with that exact conviction, everything changes. Stop chasing algorithms and start building real relationships that last.\n\nAgree or disagree? Let me know in the comments!`,
        tiktokReel: {
          hook: `Stop making this huge mistake with ${keyword}!`,
          onScreenText: `The #1 ${keyword} Mistake in 2026 🚨`,
          visualDirection: "Point at on-screen text, quick zoom in on hook statement",
          voiceoverScript: `If you want to master ${keyword} in 2026, stop listening to outdated advice. Here are the three exact levers you need to pull right now...`,
          callToAction: "Follow Think Tank Digital and comment 'GROWTH' for the free blueprint!",
          pinnedComment: "Get the full breakdown in our bio link 🚀",
          fullScript: `**Hook [0:00-0:03]:** Stop making this huge mistake with ${keyword}!\n**Visual:** Talking head with rapid zoom.\n**Core [0:03-0:30]:** Explain the 3 levers.\n**CTA [0:30-0:45]:** Follow Think Tank Digital.`
        },
        twitterThread: [
          `1/8 Most strategies for ${keyword} fail before they start.\n\nHere is the modern playbook that actually moves the needle: 🧵👇`,
          `2/8 The biggest trap: chasing short-term volume over high-leverage authority. When you cut corners, you pay the highest price.`,
          `3/8 Step 1: Prime the digital pump. Provide so much upfront value that ignoring you feels irrational.`,
          `4/8 Step 2: Answer the exact questions your ideal buyer is asking right now.`,
          `5/8 Step 3: Align your offer so the dream outcome is obvious and the perceived risk is zero.`,
          `6/8 The winning formula: Ziglar's human connection + Hormozi's ruthless execution.`,
          `7/8 If you found this breakdown valuable:\n1. Retweet the first tweet\n2. Bookmark this thread for reference`,
          `8/8 Want to dominate your market with Think Tank Digital? Book a strategy call today: https://thinktankdigital.io/strategy-session`
        ]
      };
    }

    // Assemble PlatformOutputs
    const platformOutputs: PlatformOutputs = {
      blogArticle: {
        title: parsedData.blogArticle?.title || `Think Tank Digital Guide: ${keyword}`,
        content: parsedData.blogArticle?.content || rawText
      },
      seoTags: {
        metaTitle: parsedData.seoTags?.metaTitle || `${keyword} | Think Tank Digital`,
        metaDescription: parsedData.seoTags?.metaDescription || `Master ${keyword} with Think Tank Digital's proven strategies.`,
        urlSlug: parsedData.seoTags?.urlSlug || keyword.toLowerCase().replace(/\s+/g, '-'),
        primaryKeyword: parsedData.seoTags?.primaryKeyword || keyword,
        secondaryKeywords: Array.isArray(parsedData.seoTags?.secondaryKeywords) ? parsedData.seoTags.secondaryKeywords : [keyword],
        searchIntent: parsedData.seoTags?.searchIntent || "Commercial Investigation",
        targetAudience: parsedData.seoTags?.targetAudience || "Digital marketers and business leaders",
        jsonLdSchema: typeof parsedData.seoTags?.jsonLdSchema === 'string' ? parsedData.seoTags.jsonLdSchema : JSON.stringify(parsedData.seoTags?.jsonLdSchema || {}, null, 2)
      },
      linkedinPost: parsedData.linkedinPost || "",
      facebookPost: parsedData.facebookPost || "",
      tiktokReel: {
        hook: parsedData.tiktokReel?.hook || `The truth about ${keyword}`,
        onScreenText: parsedData.tiktokReel?.onScreenText || `${keyword} in 2026`,
        visualDirection: parsedData.tiktokReel?.visualDirection || "Talking head with fast b-roll cuts",
        voiceoverScript: parsedData.tiktokReel?.voiceoverScript || "",
        callToAction: parsedData.tiktokReel?.callToAction || "Follow for more",
        pinnedComment: parsedData.tiktokReel?.pinnedComment || "Check bio link!",
        fullScript: parsedData.tiktokReel?.fullScript || parsedData.tiktokReel?.voiceoverScript || ""
      },
      twitterThread: Array.isArray(parsedData.twitterThread) ? parsedData.twitterThread : []
    };

    // Determine default primary markdown content based on requested format
    let activeContent = platformOutputs.blogArticle.content;
    let activeTitle = platformOutputs.blogArticle.title;

    if (format === 'LINKEDIN') {
      activeContent = platformOutputs.linkedinPost;
      activeTitle = `LinkedIn Post: ${keyword}`;
    } else if (format === 'FACEBOOK') {
      activeContent = platformOutputs.facebookPost;
      activeTitle = `Facebook Post: ${keyword}`;
    } else if (format === 'TIKTOK_REEL') {
      activeContent = platformOutputs.tiktokReel.fullScript || platformOutputs.tiktokReel.voiceoverScript;
      activeTitle = `TikTok/Reel Script: ${keyword}`;
    } else if (format === 'TWITTER_THREAD') {
      activeContent = platformOutputs.twitterThread.join('\n\n---\n\n');
      activeTitle = `Twitter Thread: ${keyword}`;
    } else if (format === 'SEO_TAGS') {
      activeContent = `### SEO Meta & Tags for "${keyword}"\n\n**Meta Title:** ${platformOutputs.seoTags.metaTitle}\n\n**Meta Description:** ${platformOutputs.seoTags.metaDescription}\n\n**URL Slug:** /${platformOutputs.seoTags.urlSlug}\n\n**Primary Keyword:** ${platformOutputs.seoTags.primaryKeyword}\n\n**Secondary / LSI Keywords:**\n${platformOutputs.seoTags.secondaryKeywords.map(k => `- ${k}`).join('\n')}\n\n**Search Intent:** ${platformOutputs.seoTags.searchIntent}\n\n**Target Audience:** ${platformOutputs.seoTags.targetAudience}\n\n### JSON-LD Schema Markup\n\`\`\`json\n${platformOutputs.seoTags.jsonLdSchema}\n\`\`\``;
      activeTitle = `SEO Tags & Schema: ${keyword}`;
    }

    return {
      title: activeTitle,
      content: activeContent,
      metaDescription: platformOutputs.seoTags.metaDescription,
      keyword,
      format,
      style,
      platformOutputs
    };

  } catch (error) {
    console.error("Error generating omnichannel content:", error);
    throw error;
  }
};