import React from 'react';
import { Link } from 'react-router';
import {
  RiSparkling2Line,
  RiBrainLine,
  RiSearchLine,
  RiShareLine,
  RiDatabaseLine,
  RiCodeLine,
  RiArrowLeftLine,
  RiRocketLine,
  RiTeamLine,
  RiLightbulbLine,
  RiGlobalLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';

const FeatureCard = ({ icon: Icon, title, description, gradient }) => (
  <div className="group p-5 rounded-2xl bg-white dark:bg-[#0e0f10] border border-zinc-200/60 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/20 transition-all shadow-sm hover:shadow-md">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${gradient}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5">{title}</h3>
    <p className="text-[12px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
  </div>
);

const About = () => {
  return (
    <InfoPageLayout 
      title="About Us" 
      subtitle="The Story & Technology Behind Parsu" 
      badge="Full-Stack AI Platform"
    >

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20">
          <RiSparkling2Line className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
          The Future of AI-Powered Research
        </h1>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          We're building an intelligent research assistant that combines the power of multiple AI models, vector-based knowledge retrieval, and universal social publishing into one seamless experience.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-2xl border border-cyan-500/10 dark:border-cyan-500/10 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-3">
            <RiLightbulbLine className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Our Mission</h2>
          </div>
          <p className="text-[13px] sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            To democratize access to cutting-edge AI by providing a unified platform where anyone can query multiple LLMs, upload and search through documents using RAG, and seamlessly publish content across social media — all from a single, beautifully designed interface.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 text-center">Platform Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={RiBrainLine}
            title="Multi-Model AI"
            description="Access Gemini, GPT-4o, Claude, DeepSeek, Mistral, and more — switch models on the fly for any conversation."
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <FeatureCard
            icon={RiSearchLine}
            title="RAG-Powered Search"
            description="Upload PDFs and documents to create vector embeddings for intelligent semantic search across your knowledge base."
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <FeatureCard
            icon={RiShareLine}
            title="Social Publishing"
            description="Publish photos, videos, and carousels to Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and YouTube."
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          />
          <FeatureCard
            icon={RiDatabaseLine}
            title="Vector Embeddings"
            description="MongoDB-backed vector storage with cosine similarity search for lightning-fast document retrieval."
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <FeatureCard
            icon={RiCodeLine}
            title="Custom API Keys"
            description="Bring your own API keys for unlimited access to premium models with complete control over your usage."
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <FeatureCard
            icon={RiGlobalLine}
            title="Real-Time Streaming"
            description="WebSocket-powered live responses with typing indicators and instant message delivery."
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
        </div>
      </div>

      {/* Tech Stack */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white dark:bg-[#0e0f10] rounded-2xl border border-zinc-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <RiRocketLine className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'React 19', 'Redux Toolkit', 'Tailwind CSS v4', 'Vite',
              'Node.js', 'Express', 'MongoDB & Mongoose',
              'Socket.IO', 'Google Gemini API', 'ImageKit CDN',
              'Helmet.js', 'JWT Authentication'
            ].map((tech) => (
              <div key={tech} className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <RiTeamLine className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Built with Passion</h2>
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
            This project is built as a full-stack capstone demonstrating modern web development with AI integration, real-time communication, and social media automation.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition-all shadow-lg"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default About;
