import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiHash, FiUser } from 'react-icons/fi';
import { searchService } from '../../services/searchService';
import styles from './SearchBar.module.css';

const SearchBar = ({ onSearchResults, placeholder = "Search posts, users, or hashtags..." }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({
    posts: [],
    users: [],
    hashtags: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 2) {
      performSearch();
    } else {
      setResults({ posts: [], users: [], hashtags: [] });
      setIsOpen(false);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Search posts
      const postsResponse = await searchService.searchPosts({
        q: query,
        limit: 5
      });

      // Search users
      const usersResponse = await searchService.searchUsers(query, { limit: 5 });

      // Extract hashtags from query
      const hashtagMatches = query.match(/#(\w+)/g);
      const hashtags = hashtagMatches ? hashtagMatches.map(tag => tag.slice(1)) : [];

      setResults({
        posts: postsResponse.success ? postsResponse.data.posts : [],
        users: usersResponse.success ? usersResponse.data.users : [],
        hashtags
      });

      setIsOpen(true);
      
      // Notify parent component
      if (onSearchResults) {
        onSearchResults({
          posts: postsResponse.success ? postsResponse.data.posts : [],
          query
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ posts: [], users: [], hashtags: [] });
    setIsOpen(false);
    if (onSearchResults) {
      onSearchResults({ posts: [], query: '' });
    }
  };

  const handleResultClick = (type, item) => {
    setIsOpen(false);
    setQuery('');
    
    if (type === 'hashtag') {
      // Navigate to hashtag page or filter by hashtag
      window.location.hash = `#hashtag/${item}`;
    }
  };

  const renderResults = () => {
    if (loading) {
      return <div className={styles.loading}>Searching...</div>;
    }

    if (!query.trim()) {
      return null;
    }

    const hasResults = results.posts.length > 0 || results.users.length > 0 || results.hashtags.length > 0;

    if (!hasResults) {
      return <div className={styles.noResults}>No results found for "{query}"</div>;
    }

    return (
      <div className={styles.resultsContainer}>
        {/* Hashtags */}
        {results.hashtags.length > 0 && (
          <div className={styles.resultSection}>
            <h4>Hashtags</h4>
            {results.hashtags.map((hashtag, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => handleResultClick('hashtag', hashtag)}
              >
                <FiHash className={styles.hashtagIcon} />
                <span className={styles.hashtag}>#{hashtag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {results.users.length > 0 && (
          <div className={styles.resultSection}>
            <h4>Users</h4>
            {results.users.map(user => (
              <div
                key={user._id}
                className={styles.resultItem}
                onClick={() => handleResultClick('user', user)}
              >
                <FiUser className={styles.userIcon} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {user.firstName} {user.lastName}
                  </span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {results.posts.length > 0 && (
          <div className={styles.resultSection}>
            <h4>Posts</h4>
            {results.posts.map(post => (
              <div
                key={post._id}
                className={styles.resultItem}
                onClick={() => handleResultClick('post', post)}
              >
                <div className={styles.postContent}>
                  <p className={styles.postText}>
                    {post.content.substring(0, 100)}
                    {post.content.length > 100 ? '...' : ''}
                  </p>
                  <span className={styles.postAuthor}>
                    by {post.userId.firstName} {post.userId.lastName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.searchContainer} ref={dropdownRef}>
      <div className={styles.searchInputContainer}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
        />
        {query && (
          <button className={styles.clearButton} onClick={handleClear}>
            <FiX />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={styles.searchDropdown}>
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default SearchBar;