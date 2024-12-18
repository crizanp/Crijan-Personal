"use client";
import React, { useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import parse, { domToReact } from "html-react-parser";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Load the Prism.js theme (dark theme)
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import Link from "next/link";
import PuffLoader from "react-spinners/PuffLoader"; // Import PuffLoader for the spinner
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesomeIcon
import { faLink, faTimes, faQuoteLeft, faCopy } from "@fortawesome/free-solid-svg-icons";
import QuoteCardModal from "./QuoteCardModal";

// Floating bubbles background component (same as before)
const FloatingBubbles = () => {
  const colors = ["#4C51BF", "#ED64A6", "#9F7AEA"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            backgroundColor: colors[index % colors.length],
            width: `${Math.random() * 80 + 40}px`,
            height: `${Math.random() * 80 + 40}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.2,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.5, 1, 0.5],
            transition: { duration: Math.random() * 5 + 3, repeat: Infinity },
          }}
        />
      ))}
    </div>
  );
};

// Function to extract raw text from DOM nodes (same as before)
const getRawTextFromDomNode = (node) => {
  if (typeof node === "string") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(getRawTextFromDomNode).join("");
  }
  if (node && node.props && node.props.children) {
    return getRawTextFromDomNode(node.props.children);
  }
  return "";
};
// Component to handle copyable blockquotes
const CopyableQuote = ({ quoteContent, children, handleGenerateCard }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(quoteContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied status after 2 seconds
  };

  return (
    <div className="relative bg-gray-800 p-4 rounded-lg my-5 shadow-lg">
      <FontAwesomeIcon
        icon={faQuoteLeft}
        className="text-blue-400 text-2xl absolute -top-3 left-3"
      />
      <blockquote className="text-lg italic text-gray-200 pl-10">
        {children}
      </blockquote>
      <div className="flex justify-center mt-3">
        <button
          className={`text-center text-xs px-3 mr-1 py-2 rounded-md font-semibold shadow-sm transition-colors duration-200 ${copied
            ? "bg-blue-300 text-gray-800 hover:bg-blue-500"
            : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          onClick={handleCopyQuote}
        >
          {copied ? "Copied!" : "Copy Quote"}
        </button>
        <button
          className="text-center text-xs px-3 py-2 ml-1 rounded-md font-semibold shadow-sm transition-colors duration-200  bg-blue-500 text-white  rounded"
          onClick={() => handleGenerateCard(quoteContent, "Author Name")}
        >
          Make Card
        </button>
      </div>
    </div>
  );
};

// Custom function to handle HTML parsing, highlighting code blocks, and generating TOC
// Custom function to handle HTML parsing, highlighting code blocks, and generating TOC
const customParseOptions = (headingList, handleGenerateCard) => ({
  replace: (domNode) => {
    // Only handle h1, h2, h3 tags for TOC
    if (domNode.name === "h1" || domNode.name === "h2" || domNode.name === "h3") {
      const headingText = getRawTextFromDomNode(domToReact(domNode.children));
      if (headingText.trim() === "") return null; // Skip empty headings
      const headingId = headingText.toLowerCase().replace(/\s+/g, "-");

      // Avoid duplicate entries in the heading list
      if (!headingList.some((item) => item.id === headingId)) {
        headingList.push({ id: headingId, text: headingText, tag: domNode.name });
      }

      return React.createElement(
        domNode.name,
        { id: headingId, className: `font-bold my-2 ${domNode.name === "h1" ? "text-4xl" : domNode.name === "h2" ? "text-3xl" : "text-2xl"}` },
        domToReact(domNode.children)
      );
    }

    // Handle code blocks for syntax highlighting
    if (domNode.attribs && domNode.attribs.class === "ql-syntax") {
      const codeContent = getRawTextFromDomNode(domToReact(domNode.children));
      const language = domNode.attribs["data-language"] || "javascript";
      const highlightedCode = Prism.highlight(
        codeContent,
        Prism.languages[language],
        language
      );

      const CopyableCode = () => {
        const [copied, setCopied] = useState(false);

        const handleCopyCode = () => {
          navigator.clipboard.writeText(codeContent);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset "Copied!" message
        };

        return (
          <div className="relative bg-[#282c34] p-5 rounded-lg mb-6 shadow-lg overflow-x-auto">
            <pre className="text-sm font-mono text-gray-200 leading-relaxed whitespace-pre-wrap">
              <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
            <button
              className={`absolute top-1.5 right-2 text-xs px-2 py-2 rounded-md font-semibold shadow-sm transition-colors duration-200 ${copied
                ? "bg-blue-300 text-gray-800 hover:bg-blue-500"
                : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              onClick={handleCopyCode}
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        );
      };

      return <CopyableCode />;
    }

    if (domNode.name === "blockquote") {
      const quoteContent = getRawTextFromDomNode(domToReact(domNode.children));

      return (
        <CopyableQuote quoteContent={quoteContent} handleGenerateCard={handleGenerateCard}>
          {domToReact(domNode.children)}
        </CopyableQuote>
      );
    }
  },
});



export default function BlogDetail({ params }) {
  const { slug } = params;
  const [selectedQuote, setSelectedQuote] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");

  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true); // Loader state
  const [error, setError] = useState(null);
  const router = useRouter();
  const [tableOfContents, setTableOfContents] = useState([]); // TOC state
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [selectedImage, setSelectedImage] = useState(""); // Selected image for modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Fetch categories and tags dynamically from an API
  async function fetchCategories() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const categoriesData = await res.json();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }
  const handleGenerateCard = (quote, author) => {
    setSelectedQuote(quote);
    setSelectedAuthor(author || "Cizan"); // Use "Cizan" if no author is provided
    setIsModalOpen(true);
  };
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };
  
  
  
  // Fetch tags dynamically from an API
  async function fetchTags() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`);
      if (!res.ok) throw new Error("Failed to fetch tags");

      const posts = await res.json();
      const tagsSet = new Set();

      posts.forEach((post) => {
        if (Array.isArray(post.tags)) {
          post.tags.forEach((tag) => tagsSet.add(tag));
        }
      });

      setTags(Array.from(tagsSet));
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }

  // Fetch post and similar posts based on category
  // Inside BlogDetail component where you are generating the TOC
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true); // Show loader while fetching data

        // Fetch all posts
        const postsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts`
        );
        if (!postsResponse.ok) throw new Error("Failed to fetch posts");
        const allPosts = await postsResponse.json();

        // Find the current post by slug
        const currentPost = allPosts.find((p) => p.slug === slug);
        if (!currentPost) throw new Error("Post not found");
        setPost(currentPost);

        // Set latest posts (limit to 5)
        setLatestPosts(allPosts.slice(0, 5));

        // Filter similar posts by category (excluding the current post)
        const similar = allPosts
          .filter(
            (p) =>
              p.category === currentPost.category && p.slug !== currentPost.slug
          )
          .slice(0, 2); // Limit to 2 posts
        setSimilarPosts(similar);

        // Fetch categories and tags
        await Promise.all([fetchCategories(), fetchTags()]);

        // Generate Table of Contents (only for h1, h2, h3 tags)
        const headingList = [];
        parse(currentPost.content, customParseOptions(headingList, handleGenerateCard));
        setTableOfContents(headingList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Hide loader after data is fetched
      }
    }

    fetchData();
  }, [slug]);

  // Function to open the modal with the selected image
 
  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Helper function to format the date properly
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available"; // Handle missing date

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"; // If the date is invalid
    }

    // Return the formatted date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <PuffLoader color="#36D7B7" size={150} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-white text-5xl text-center mb-4">OOPS!</h1>
        <h2 className="text-gray-400  text-1xl text-center mb-4">{`The page you are looking for might have been removed, or is temporarily unavailable.

`}</h2>
        <div className="flex gap-4">
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back to Home
          </Link>
          <Link
            href="/category"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            All Categories
          </Link>
        </div>
      </div>
    );
  }
  if (!post) return notFound();
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-10">


      <FloatingBubbles /> {/* Add floating bubbles */}

      {/* Main Content Layout */}
      <div className="lg:flex lg:space-x-5"> {/* Apply flex for large screens */}

        {/* Main Content */}
        <main className="lg:w-3/4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-center">{post.title}</h1>
          <p className="text-gray-400 mb-5 text-center">{formatDate(post.createdAt)}</p>

          {/* Image */}
          {post.imageUrl && (
            <div className="mb-10 text-center">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="max-w-xs md:max-w-md mx-auto rounded-lg shadow-md object-cover cursor-pointer"
                style={{ height: "auto" }}
                onClick={() => handleImageClick(post.imageUrl)} // Open modal on click
              />
              {isImageModalOpen && selectedImage && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative">
        <img
          src={selectedImage}
          alt="Selected"
          className="max-w-full max-h-screen rounded-lg"
        />
        <button
          className="absolute top-3 right-3 text-white bg-gray-900 p-2 rounded hover:bg-gray-800"
          onClick={closeImageModal}
        >
          <FontAwesomeIcon icon={faTimes} size="2x" />
        </button>
      </div>
    </div>
  )}

            </div>
          )}

          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <div className="mb-10 bg-gray-800 p-5 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Table of Contents</h2>
              <ul className="space-y-2 list-disc list-inside">
                {tableOfContents.map((heading, index) => (
                  <li key={index} className="flex items-center">
                    <FontAwesomeIcon icon={faLink} className="text-blue-400 mr-2" />
                    <a href={`#${heading.id}`} className="text-blue-500 hover:text-blue-700">
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Post Content */}
          <article className="prose lg:prose-xl dark:prose-invert mx-auto">
            {parse(post.content, customParseOptions([], handleGenerateCard))}
          </article>

          {/* Similar Posts */}
          {similarPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-3xl font-bold mb-5">Similar Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {similarPosts.map((similarPost) => (
                  <Link key={similarPost._id} href={`/blog/${similarPost.slug}`}>
                    <div className="bg-gray-800 p-5 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-200">
                      <h3 className="text-xl font-semibold">{similarPost.title}</h3>
                      <p className="text-gray-400">{formatDate(similarPost.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="lg:w-1/4 lg:sticky lg:top-10 lg:self-start mt-10 lg:mt-0"> {/* Make sticky only on large screens */}
          <div
            className="bg-gray-800 p-5 rounded-lg shadow-lg space-y-8 overflow-y-auto max-h-screen"
            style={{
              scrollbarWidth: "none", // For Firefox
              msOverflowStyle: "none", // For Internet Explorer and Edge
            }}
          >
            <style jsx>{`
              ::-webkit-scrollbar {
                display: none; /* Hide scrollbar for WebKit browsers */
              }
            `}</style>

            {/* Categories */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Categories</h2>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category._id}>
                    <Link
                      href={`/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-600 transition-all duration-200"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Tags */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 text-gray-400 px-2 py-1 rounded-md text-sm hover:text-white transition-all duration-200"
                    >
                      <Link
                        key={index}
                        href={`/tags/${tag.toLowerCase().replace(/\s+/g, "-")}`}

                      >{tag}</Link>

                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No tags available.</p>
                )}
              </div>
            </section>

            {/* Latest Posts */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Latest Posts</h2>
              <ul className="space-y-2">
                {latestPosts.map((post) => (
                  <li key={post._id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-600 transition-all duration-200"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </aside>
      </div>
      <QuoteCardModal
  quote={selectedQuote}
  author={selectedAuthor}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
    </div>
  );
}