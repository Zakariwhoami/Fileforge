import { useState } from 'react'
import './App.css'

import {
  FileText,
  Image,
  FileImage,
  Minimize2,
  Merge,
  Scissors,
  ArrowRight,
  ShieldCheck,
  Zap,
  CloudUpload,
  Menu
} from 'lucide-react'

const tools = [
  {
    name: 'Word to PDF',
    description: 'Convert DOCX documents into PDF.',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    name: 'Image Compressor',
    description: 'Reduce image size without losing quality.',
    icon: Image,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    name: 'PDF Compressor',
    description: 'Make your PDF documents smaller.',
    icon: Minimize2,
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  {
    name: 'Image Converter',
    description: 'Convert JPG, PNG and WebP images.',
    icon: FileImage,
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one.',
    icon: Merge,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    name: 'Split PDF',
    description: 'Separate PDF pages easily.',
    icon: Scissors,
    color: 'text-pink-600',
    bg: 'bg-pink-50'
  }
]

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* Navbar */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <a href="/" className="text-2xl font-bold tracking-tight">
            File<span className="text-blue-600">Forge.</span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#tools" className="hover:text-blue-600">Tools</a>
            <a href="#about" className="hover:text-blue-600">About</a>
            <a href="#features" className="hover:text-blue-600">Features</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-medium hover:text-blue-600">
              Login
            </a>

            <a
              href="/register"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Get Started
            </a>

            <button className="md:hidden">
              <Menu />
            </button>
          </div>

        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">

        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-7">
          <Zap size={16} />
          Your files, handled smarter
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
          Everything you need
          <span className="text-blue-600"> for your files.</span>
        </h1>

        <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
          Convert, compress and manage your documents and images
          with ease. Everything in one simple platform.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-9">
          <a
            href="#tools"
            className="bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            Explore Tools <ArrowRight size={18} />
          </a>

          <a
            href="/register"
            className="border border-slate-200 px-7 py-3.5 rounded-xl font-semibold hover:bg-slate-50"
          >
            Create Free Account
          </a>
        </div>

        {/* Upload area - interface only for now */}
        <div className="max-w-3xl mx-auto mt-16 border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-2xl p-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <CloudUpload size={32} />
          </div>

          <h3 className="font-semibold text-xl mt-5">
            Drop your files here
          </h3>

          <p className="text-slate-500 text-sm mt-2">
            Convert or compress your files in seconds.
          </p>

          <p className="text-xs text-slate-400 mt-4">
            File upload functionality will be connected in our next stages.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
              Our tools
            </p>

            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Everything in one place
            </h2>

            <p className="text-slate-500 mt-3">
              Powerful tools to make file management simple.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon

              return (
                <div
                  key={tool.name}
                  className="bg-white border border-slate-100 p-7 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition duration-300"
                >
                  <div className={`${tool.bg} ${tool.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>

                  <h3 className="font-bold text-lg mt-5">
                    {tool.name}
                  </h3>

                  <p className="text-slate-500 text-sm mt-2">
                    {tool.description}
                  </p>

                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm mt-6"
                  >
                    Try tool <ArrowRight size={16} />
                  </a>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-10">

          <div>
            <ShieldCheck className="text-blue-600" size={30} />
            <h3 className="font-bold mt-4">Privacy first</h3>
            <p className="text-slate-500 text-sm mt-2">
              Build secure file processing with automatic temporary file cleanup.
            </p>
          </div>

          <div>
            <Zap className="text-blue-600" size={30} />
            <h3 className="font-bold mt-4">Fast processing</h3>
            <p className="text-slate-500 text-sm mt-2">
              Efficient tools for converting and compressing your files.
            </p>
          </div>

          <div>
            <CloudUpload className="text-blue-600" size={30} />
            <h3 className="font-bold mt-4">Easy to use</h3>
            <p className="text-slate-500 text-sm mt-2">
              A simple interface for managing your documents and images.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 FileForge. All rights reserved.</p>
          <p>Convert anything. Compress everything.</p>
        </div>
      </footer>

    </div>
  )
}

export default App
