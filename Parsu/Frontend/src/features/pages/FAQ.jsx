import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  RiQuestionLine,
  RiArrowLeftLine,
  RiArrowDownSLine,
  RiSparkling2Line,
  RiShareLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiKey2Line,
  RiDatabaseLine,
  RiImageLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';

const faqData = [
  {
    category: "AI Models",
    icon: RiSparkling2Line,
    questions: [
      {
        q: "Which AI models are available?",
        a: "We support Google Gemini (2.5 Flash, 2.5 Pro), OpenAI (GPT-4o, GPT-4o Mini), Anthropic (Claude 3.5 Sonnet, Claude 4), DeepSeek (R1, V3), Mistral, Groq (Llama, Gemma), and more. You can switch between models at any time during a conversation."
      },
      {
        q: "Can I use my own API keys?",
        a: "Yes! Go to Settings to add custom API keys for any supported provider. This unlocks premium models and gives you full control over your usage and billing."
      },
      {
        q: "Is there a limit on how many messages I can send?",
        a: "Free-tier models have rate limits to ensure fair usage. Using your own API keys bypasses these limits entirely."
      }
    ]
  },
  {
    category: "Social Publishing",
    icon: RiShareLine,
    questions: [
      {
        q: "Which social media platforms are supported?",
        a: "We support Instagram, Facebook, Twitter/X, LinkedIn, Pinterest, TikTok, and YouTube. Connect your accounts through the Social Hub to enable one-click publishing."
      },
      {
        q: "Can the AI generate captions and hashtags?",
        a: "Absolutely! Just ask the AI to create captions, hashtags, or descriptions — it analyzes your images and content to generate platform-optimized social copy."
      },
      {
        q: "Can I post to multiple platforms at once?",
        a: "Yes! You can upload images and instruct the AI to post them together as a carousel or separately across multiple platforms in a single message."
      },
      {
        q: "What content formats are supported?",
        a: "Photos (JPEG, PNG, WebP), Videos (MP4, MOV), and carousel posts (multiple images). Each platform receives content in its optimal format."
      }
    ]
  },
  {
    category: "RAG & Document Search",
    icon: RiSearchLine,
    questions: [
      {
        q: "What is RAG search?",
        a: "RAG (Retrieval-Augmented Generation) lets you upload documents and search through them semantically. We create vector embeddings of your content so you can find relevant information using natural language queries."
      },
      {
        q: "What file types can I upload?",
        a: "We support PDF, TXT, Markdown (.md), DOC, and DOCX files. Uploaded documents are processed and stored as vector embeddings for intelligent retrieval."
      },
      {
        q: "Where are my embeddings stored?",
        a: "Vector embeddings are stored in MongoDB alongside your chat data. They're tied to your account and are deleted when you remove the document or delete your account."
      }
    ]
  },
  {
    category: "Privacy & Security",
    icon: RiShieldCheckLine,
    questions: [
      {
        q: "Is my data secure?",
        a: "Yes. We use HTTPS encryption, Helmet.js security headers, JWT authentication with HTTP-only cookies, and encrypted storage for API keys and social tokens."
      },
      {
        q: "Can I delete my data?",
        a: "You can delete individual chats from the Library, or delete your entire account from Settings. All associated data (chats, embeddings, files, social tokens) will be permanently removed."
      },
      {
        q: "Do AI providers see my data?",
        a: "When you send a message, your prompt is forwarded to the selected AI provider for processing. Each provider has its own data retention policies. We recommend reviewing their privacy policies linked in our Privacy Policy page."
      }
    ]
  },
  {
    category: "Custom API Keys",
    icon: RiKey2Line,
    questions: [
      {
        q: "How do I add a custom API key?",
        a: "Go to Settings → Custom API Keys section. Enter your API key and select the provider. The key is encrypted and stored securely."
      },
      {
        q: "Are my API keys stored safely?",
        a: "Yes. API keys are encrypted at rest and are never exposed in logs or API responses. Only you can view or manage your keys."
      }
    ]
  }
];

const AccordionItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-zinc-100 dark:border-white/5 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-4 py-4 text-left group cursor-pointer"
    >
      <span className={`text-[13px] sm:text-sm font-semibold transition-colors ${isOpen ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
        {question}
      </span>
      <RiArrowDownSLine className={`w-4 h-4 shrink-0 mt-0.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
      <p className="text-[12px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-0.5">
        {answer}
      </p>
    </div>
  </div>
);

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryIdx, questionIdx) => {
    const key = `${categoryIdx}-${questionIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <InfoPageLayout 
      title="FAQ" 
      subtitle="Frequently Asked Questions & Answers" 
      badge="Knowledge Base"
    >
      <div>
        {/* Intro */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <RiQuestionLine className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">How can we help?</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Find answers to common questions about our platform.</p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqData.map((category, catIdx) => (
            <div key={catIdx} className="bg-white dark:bg-[#0e0f10] rounded-2xl border border-zinc-200/60 dark:border-white/5 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <category.icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{category.category}</h2>
              </div>
              {category.questions.map((item, qIdx) => (
                <AccordionItem
                  key={qIdx}
                  question={item.q}
                  answer={item.a}
                  isOpen={!!openItems[`${catIdx}-${qIdx}`]}
                  onToggle={() => toggleItem(catIdx, qIdx)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">Still have questions?</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition-all shadow-lg"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default FAQ;
