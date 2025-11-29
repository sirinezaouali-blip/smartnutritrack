import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { FiHeart, FiMessageCircle, FiShare2, FiPlus, FiUsers, FiSearch, FiSend, FiImage, FiCamera } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import PostCreationModal from '../../components/social/PostCreationModal';
import { socialService } from '../../services/socialService';
import styles from './Social.module.css'; 
import NotificationBell from '../../components/social/NotificationBell';
import SearchBar from '../../components/social/SearchBar';
import { searchService } from '../../services/searchService';
import UserProfileCard from '../../components/social/UserProfileCard';
import { profileService } from '../../services/profileService';
import CategoryFilter from '../../components/social/CategoryFilter';
import AchievementNotification from '../../components/social/AchievementNotification';
import ShareModal from '../../components/social/ShareModal';

const Social = () => {
  const { userProfile } = useUser();
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [followSuggestions, setFollowSuggestions] = useState([]);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [quickPostContent, setQuickPostContent] = useState('');
  const [quickPostImages, setQuickPostImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    types: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const [activeCategories, setActiveCategories] = useState([]);
  const [achievementNotification, setAchievementNotification] = useState(null);
  const [doubleClickLike, setDoubleClickLike] = useState(null);
  const [shareModal, setShareModal] = useState({ isOpen: false, post: null });

  useEffect(() => {
  loadTrendingHashtags();
}, []);

// Add these functions to handle sharing
const handleShareClick = (post) => {
  setShareModal({ isOpen: true, post });
};

const handleCloseShareModal = () => {
  setShareModal({ isOpen: false, post: null });
};

const handlePostDoubleClick = (postId) => {
  const post = posts.find(p => p.id === postId);
  if (!post || post.liked) return; // Don't like if already liked

  // Show floating heart animation
  setDoubleClickLike({ postId, timestamp: Date.now() });
  
  // Trigger like
  handleLike(postId);
};

// Add this function to simulate earning achievements
const simulateAchievement = () => {
  const achievements = [
    {
      id: 1,
      name: 'First Post!',
      description: 'You shared your first post with the community',
      icon: '📝',
      points: 10,
      rarity: 'common'
    },
    {
      id: 2,
      name: 'Social Butterfly',
      description: 'You reached 10 followers',
      icon: '🦋',
      points: 20,
      rarity: 'common'
    },
    {
      id: 3,
      name: 'Meal Prep Master',
      description: 'You shared 25 meal posts',
      icon: '🍽️',
      points: 50,
      rarity: 'rare'
    },
    {
      id: 4,
      name: 'Consistency King',
      description: '7-day posting streak maintained',
      icon: '🔥',
      points: 30,
      rarity: 'epic'
    }
  ];

  // Pick a random achievement for demo
  const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
  setAchievementNotification(randomAchievement);
};

// Add this function to handle notification close
const handleAchievementClose = () => {
  setAchievementNotification(null);
};


// Add these functions to handle category filtering
const handleCategoryChange = (categories) => {
  setActiveCategories(categories);
  
  if (categories.length === 0) {
    // If no categories selected, show all posts
    if (isSearching) {
      // If we're in search mode, keep the search results
      return;
    }
    loadSocialData();
  } else {
    // Filter posts by selected categories
    filterPostsByCategories(categories);
  }
};

const filterPostsByCategories = async (categories) => {
  try {
    setIsSearching(true);
    setSearchQuery(`Categories: ${categories.join(', ')}`);
    
    // Use search service to filter by post types
    const response = await searchService.searchPosts({
      types: categories.join(','),
      limit: 50
    });
    
    if (response.success) {
      setPosts(response.data.posts.map(formatPost));
    }
  } catch (error) {
    console.error('Error filtering posts by category:', error);
    // Fallback: filter existing posts locally
    const filteredPosts = posts.filter(post => 
      categories.includes(post.type)
    );
    setPosts(filteredPosts);
  }
};

const handleClearFilters = () => {
  setActiveCategories([]);
  setIsSearching(false);
  setSearchQuery('');
  loadSocialData();
};

const loadTrendingHashtags = async () => {
  try {
    const response = await searchService.getTrendingHashtags(8);
    if (response.success) {
      setTrendingHashtags(response.data.hashtags);
    }
  } catch (error) {
    console.error('Error loading trending hashtags:', error);
  }
};

const handleSearchResults = (results) => {
  if (results.query) {
    setIsSearching(true);
    setPosts(results.posts);
    setSearchQuery(results.query);
  } else {
    setIsSearching(false);
    loadSocialData(); // Reload original feed
  }
};

// Replace your existing handleHashtagClick function with this:
const handleHashtagClick = async (hashtag) => {
  try {
    setIsSearching(true);
    setSearchQuery(`#${hashtag}`);
    
    const response = await searchService.getPostsByHashtag(hashtag);
    if (response.success) {
      setPosts(response.data.posts.map(formatPost));
    } else {
      // Fallback: filter existing posts by hashtag
      const filteredPosts = posts.filter(post => 
        post.content.toLowerCase().includes(`#${hashtag.toLowerCase()}`)
      );
      setPosts(filteredPosts);
    }
  } catch (error) {
    console.error('Error loading posts by hashtag:', error);
    // Fallback to local filtering
    const filteredPosts = posts.filter(post => 
      post.content.toLowerCase().includes(`#${hashtag.toLowerCase()}`)
    );
    setPosts(filteredPosts);
  }
};

const clearSearch = () => {
  setIsSearching(false);
  setSearchQuery('');
  setActiveCategories([]);
  loadSocialData();
};

  useEffect(() => {
    loadSocialData();
    loadProfileStats();
  }, [userProfile?.id]);


  const loadProfileStats = async () => {
  if (!userProfile?.id) return;
  
  try {
    const response = await profileService.getProfileStats(userProfile.id);
    if (response.success) {
      setProfileStats(response.data);
    }
  } catch (error) {
    console.error('Error loading profile stats:', error);
    // It will use mock data from the service
  }
};

  // Handle quick post submission
  const handleQuickPostSubmit = async () => {
    if (!quickPostContent.trim()) return;

    try {
      let mediaUrls = [];
      
      // Upload images if any
      if (quickPostImages.length > 0) {
        for (const image of quickPostImages) {
          const uploadResult = await socialService.uploadImage(image);
          if (uploadResult.success) {
            mediaUrls.push({
              url: uploadResult.data.url,
              type: 'image',
              caption: ''
            });
          }
        }
      }

      // Create the post
      const postData = {
        type: 'tip', // Default type for quick posts
        content: quickPostContent.trim(),
        mediaUrls,
        visibility: 'public',
        allowComments: true,
        allowSharing: true
      };

      const result = await socialService.createPost(postData);
      
      if (result.success) {
        // Add the new post to the feed
        const newPost = formatPost(result.data);
        setPosts(prev => [newPost, ...prev]);
        
        // Reset quick post form
        setQuickPostContent('');
        setQuickPostImages([]);
      }
    } catch (error) {
      console.error('Error creating quick post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle direct image upload
  const handleDirectImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      if (quickPostImages.length + imageFiles.length > 4) {
        alert('Maximum 4 images allowed');
        return;
      }

      setQuickPostImages(prev => [...prev, ...imageFiles]);
      
      // If no content, focus the textarea
      if (!quickPostContent) {
        setTimeout(() => {
          document.querySelector(`.${styles.postInput}`)?.focus();
        }, 100);
      }
    }

    // Reset file input
    event.target.value = '';
  };

  // Remove image from quick post
  const removeQuickPostImage = (index) => {
    setQuickPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const loadSocialData = async () => {
    setLoading(true);
    try {
      // Load feed
      const feedResponse = await socialService.getFeed();
      if (feedResponse.success) {
        setPosts(feedResponse.data.posts.map(formatPost));
      }

      // Load follow suggestions
      const suggestionsResponse = await socialService.getFollowSuggestions(4);
      if (suggestionsResponse.success) {
        setFollowSuggestions(suggestionsResponse.data.suggestions || []);
      }

      // Load following
      if (userProfile?.id) {
        const followingResponse = await socialService.getFollowing(userProfile.id);
        if (followingResponse.success) {
          const followingIds = new Set(followingResponse.data.following.map(user => user._id));
          setFollowingUsers(followingIds);
        }
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      // Fallback to mock data
      setPosts(getMockPosts());
    } finally {
      setLoading(false);
    }
  };

  const formatPost = (post) => ({
    id: post._id,
    user: {
      id: post.userId._id,
      name: `${post.userId.firstName} ${post.userId.lastName}`,
      avatar: post.userId.social?.profilePicture || post.userId.firstName?.charAt(0) || '👤'
    },
    content: post.content,
    title: post.title,
    type: post.type,
    mediaUrls: post.mediaUrls || [],
    likes: post.likes?.length || 0,
    comments: post.comments?.map(comment => ({
      id: comment._id,
      user: `${comment.userId?.firstName} ${comment.userId?.lastName}`,
      text: comment.text,
      timeAgo: formatTimeAgo(new Date(comment.createdAt))
    })) || [],
    timeAgo: formatTimeAgo(new Date(post.createdAt)),
    liked: post.likes?.some(like => 
      typeof like === 'object' ? like._id === userProfile?.id : like === userProfile?.id
    ) || false
  });

  const getMockPosts = () => [
    {
      id: 1,
      user: { id: 'mock1', name: 'Sarah Johnson', avatar: '👩‍🍳' },
      content: 'Just finished meal prepping for the week! 🥗 So excited to stay on track with my nutrition goals. #MealPrep #HealthyEating',
      mediaUrls: [],
      likes: 24,
      comments: [
        { id: 1, user: 'Mike Chen', text: 'Looks amazing! What recipes did you use?', timeAgo: '1h ago' },
        { id: 2, user: 'Emma Wilson', text: 'Love the organization! 💪', timeAgo: '30m ago' }
      ],
      timeAgo: '2h ago',
      liked: false
    },
    {
      id: 2,
      user: { id: 'mock2', name: 'Mike Chen', avatar: '👨‍💻' },
      content: 'Hit my protein goal for the 7th day in a row! Consistency is key 💯 #FitnessJourney #Protein',
      mediaUrls: [],
      likes: 15,
      comments: [
        { id: 3, user: 'Alex Rodriguez', text: 'Great work! Keep it up!', timeAgo: '45m ago' }
      ],
      timeAgo: '3h ago',
      liked: true
    }
  ];

  const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Replace your existing handleLike function with this improved version:
  const handleLike = async (postId) => {
  // Get current post state for optimistic update
  const currentPost = posts.find(post => post.id === postId);
  if (!currentPost) return;

  // Optimistic update - update UI immediately
  const wasLiked = currentPost.liked;
  const newLikeCount = wasLiked ? currentPost.likes - 1 : currentPost.likes + 1;

  setPosts(prev => prev.map(post =>
    post.id === postId ? {
      ...post,
      liked: !wasLiked,
      likes: newLikeCount,
      isLiking: true // Add loading state
    } : post
  ));

  try {
    // Send to backend
    await socialService.toggleLike(postId);
    
    // Remove loading state on success
    setPosts(prev => prev.map(post =>
      post.id === postId ? {
        ...post,
        isLiking: false
      } : post
    ));
  } catch (error) {
    console.error('Error toggling like:', error);
    
    // Revert on error
    setPosts(prev => prev.map(post =>
      post.id === postId ? {
        ...post,
        liked: wasLiked, // Revert like state
        likes: currentPost.likes, // Revert like count
        isLiking: false
      } : post
    ));
  }
};

  // Replace your existing handleAddComment function with this improved version:
  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    // Create optimistic update (show comment immediately)
    const optimisticComment = {
      id: `temp-${Date.now()}`, // Temporary ID
      user: `${userProfile?.firstName} ${userProfile?.lastName}`,
      text: commentText,
      timeAgo: 'Just now',
      isOptimistic: true // Flag for optimistic update
    };

    // Update UI immediately
    setPosts(prev => prev.map(post =>
      post.id === postId ? {
        ...post,
        comments: [...post.comments, optimisticComment],
        commentsCount: (post.comments.length + 1) // Update count immediately
      } : post
    ));

    // Clear input immediately
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setShowCommentInput(prev => ({ ...prev, [postId]: false }));

    try {
      // Send to backend
      const result = await socialService.addComment(postId, { text: commentText });
      
      if (result.success) {
        // Replace optimistic comment with real one from backend
        setPosts(prev => prev.map(post =>
          post.id === postId ? {
            ...post,
            comments: post.comments.map(comment => 
              comment.isOptimistic 
                ? {
                    id: result.data._id,
                    user: `${userProfile?.firstName} ${userProfile?.lastName}`,
                    text: result.data.text,
                    timeAgo: 'Just now'
                  }
                : comment
            )
          } : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // If error, remove the optimistic comment and show error
      setPosts(prev => prev.map(post =>
        post.id === postId ? {
          ...post,
          comments: post.comments.filter(comment => !comment.isOptimistic),
          commentsCount: post.comments.length - 1
        } : post
      ));
      
      // Show error message (you can add a proper notification system later)
      alert('Failed to add comment. Please try again.');
      
      // Re-open comment input
      setShowCommentInput(prev => ({ ...prev, [postId]: true }));
      setCommentInputs(prev => ({ ...prev, [postId]: commentText }));
    }
  };

  const handleFollow = async (userId) => {
    try {
      if (followingUsers.has(userId)) {
        await socialService.unfollowUser(userId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await socialService.followUser(userId);
        setFollowingUsers(prev => new Set([...prev, userId]));
        setFollowSuggestions(prev => prev.filter(user => user._id !== userId));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePostModal(false);
  };

  if (loading) {
    return (
      <div className={styles.socialLoading}>
        <LoadingSpinner size="large" message="Loading social feed..." />
      </div>
    );
  }

  // Add this function to your Social component (before the return statement)
  const renderContentWithHashtags = (content) => {
    if (!content) return '';
    
    // Split content and detect hashtags
    const words = content.split(/(\s+)/);
    
    return words.map((word, index) => {
      // Check if word is a hashtag (starts with # and has letters/numbers after)
      if (word.startsWith('#') && word.length > 1 && /^#[a-zA-Z0-9_]+$/.test(word)) {
        return (
          <span
            key={index}
            className={styles.hashtag}
            onClick={() => handleHashtagClick(word.slice(1))} // Remove the # symbol
            style={{ cursor: 'pointer' }}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <div className={styles.socialPage}>
      {/* Header */}
      <div className={styles.socialHeader}>
        <div className={styles.headerContent}>
          <h1>Social Feed</h1>
          <p>Connect with the SmartNutriTrack community</p>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell />
          <button 
            className={`${styles.createPostBtn} ${styles.primary}`}
            onClick={() => setShowCreatePostModal(true)}
          >
            <FiPlus />
            Create Post
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.socialContent}>
        {/* Left Sidebar - Suggestions */}
        <div className={styles.sidebar}>
          <UserProfileCard userProfile={userProfile} profileStats={profileStats} />
          {/* Search Bar */}
          <div className={styles.sidebarCard}>
            <SearchBar 
              onSearchResults={handleSearchResults}
              placeholder="Search posts, users, hashtags..."
            />
          </div>

          {/* Trending Hashtags */}
          {trendingHashtags.length > 0 && (
            <div className={styles.sidebarCard}>
              <h3>Trending Hashtags</h3>
              <div className={styles.trendingHashtags}>
                {trendingHashtags.map(hashtag => (
                  <button
                    key={hashtag.tag}
                    className={styles.hashtagButton}
                    onClick={() => handleHashtagClick(hashtag.tag)}
                  >
                    <span className={styles.hashtag}>#{hashtag.tag}</span>
                    <span className={styles.hashtagCount}>{hashtag.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Status */}
          {isSearching && (
            <div className={styles.sidebarCard}>
              <div className={styles.searchStatus}>
                <span>Showing results for: "{searchQuery}"</span>
                <button 
                  className={styles.clearSearchButton}
                  onClick={clearSearch}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Existing Suggestions and Stats cards remain the same */}
          <div className={styles.sidebarCard}>
            <h3>Suggestions</h3>
            {/* ... existing suggestions code ... */}
          </div>

          <div className={styles.sidebarCard}>
            <h3>Community Stats</h3>
            {/* ... existing stats code ... */}
          </div>
        </div>

        {/* Main Feed */}
        <div className={styles.feedContainer}>
          {/* Temporary demo button - remove this later */}
          <div className={styles.demoSection}>
            <button 
              className={styles.demoButton}
              onClick={simulateAchievement}
            >
              🏆 Test Achievement Notification
            </button>
            <small className={styles.demoHint}>(Click to test achievement popup)</small>
          </div>

          {/* Add Category Filter */}
          <CategoryFilter
            activeCategories={activeCategories}
            onCategoryChange={handleCategoryChange}
            onClearFilters={handleClearFilters}
          />
          {/* Create Post Card */}
          <div className={styles.createPostCard}>
            <div className={styles.postInputSection}>
              <div className={styles.userAvatar}>
                {userProfile?.firstName?.charAt(0) || '👤'}
              </div>
              <div className={styles.postInputContainer}>
                <textarea
                  className={styles.postInput}
                  placeholder="Share your nutrition journey..."
                  value={quickPostContent}
                  onChange={(e) => setQuickPostContent(e.target.value)}
                  rows="3"
                />
                
                {/* Image Preview */}
                {quickPostImages.length > 0 && (
                  <div className={styles.quickPostImages}>
                    {quickPostImages.map((image, index) => (
                      <div key={index} className={styles.quickPostImageItem}>
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className={styles.quickPostImage}
                        />
                        <button
                          type="button"
                          className={styles.removeQuickPostImage}
                          onClick={() => removeQuickPostImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {quickPostContent && (
                  <div className={styles.quickPostActions}>
                    <button 
                      className={styles.cancelQuickPost}
                      onClick={() => {
                        setQuickPostContent('');
                        setQuickPostImages([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.submitQuickPost}
                      onClick={handleQuickPostSubmit}
                      disabled={!quickPostContent.trim()}
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.postActions}>
              <button 
                className={styles.actionBtn}
                onClick={() => document.getElementById('image-upload').click()}
              >
                <FiImage />
                Photo
              </button>
              <button 
                className={styles.actionBtn}
                onClick={() => setShowCreatePostModal(true)}
              >
                <FiCamera />
                Advanced
              </button>
              
              {/* Hidden file input for direct photo upload */}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleDirectImageUpload}
              />
            </div>
          </div>

          {/* Posts Feed */}
          <div className={styles.postsFeed}>
            {posts.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No posts yet</h3>
                <p>Be the first to share your nutrition journey!</p>
                <button 
                  className={styles.primary}
                  onClick={() => setShowCreatePostModal(true)}
                >
                  Create First Post
                </button>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className={styles.postCard}>
                  {/* Post Header */}
                  <div className={styles.postHeader}>
                    <div className={styles.postUser}>
                      <div className={styles.userAvatar}>{post.user.avatar}</div>
                      <div className={styles.userDetails}>
                        <span className={styles.userName}>{post.user.name}</span>
                        <span className={styles.postTime}>{post.timeAgo}</span>
                      </div>
                    </div>
                    {post.user.id !== userProfile?.id && (
                      <button
                        className={`${styles.followBtn} ${styles.small} ${followingUsers.has(post.user.id) ? styles.following : ''}`}
                        onClick={() => handleFollow(post.user.id)}
                      >
                        {followingUsers.has(post.user.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className={styles.postContent}>
                    <p>{renderContentWithHashtags(post.content)}</p>
                  </div>

                  {/* Post Actions */}
                  <div className={styles.postActions}>
                    <button 
                      className={`${styles.actionBtn} ${post.liked ? styles.liked : ''} ${post.isLiking ? styles.liking : ''}`}
                      onClick={() => handleLike(post.id)}
                      disabled={post.isLiking}
                      key={`like-${post.id}-${post.likes}-${post.liked}`}
                    >
                      <FiHeart className={post.liked ? styles.heartIcon : ''} />
                      {post.likes}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.commentCountUpdate}`}
                      onClick={() => setShowCommentInput(prev => ({
                        ...prev,
                        [post.id]: !prev[post.id]
                      }))}
                      key={`comment-${post.id}-${post.comments.length}`}
                    >
                      <FiMessageCircle />
                      {post.comments.length}
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleShareClick(post)}
                    >
                      <FiShare2 />
                      Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showCommentInput[post.id] && (
                    <div className={styles.commentsSection}>
                      <div className={styles.addComment}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          className={commentInputs[post.id]?.includes('temp-') ? styles.commentInputLoading : ''}
                          disabled={commentInputs[post.id]?.includes('temp-')}
                        />
                        <button 
                          className={`${styles.sendBtn} ${
                            commentInputs[post.id]?.includes('temp-') ? styles.sendButtonLoading : ''
                          }`}
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim() || commentInputs[post.id]?.includes('temp-')}
                        >
                          <FiSend />
                        </button>
</div>
                      <div className={styles.commentsList}>
                        {post.comments.map(comment => (
                          <div 
                            key={comment.id} 
                            className={`${styles.comment} ${
                              comment.isOptimistic ? styles.optimisticComment : ''
                            } ${comment.isError ? styles.commentError : ''}`}
                          >
                            <div className={styles.commentUser}>
                              {comment.user}
                              {comment.isOptimistic && (
                                <span className={styles.postingText}> (Posting...)</span>
                              )}
                            </div>
                            <div className={styles.commentText}>{comment.text}</div>
                            <div className={styles.commentTime}>{comment.timeAgo}</div>
                          </div>
                        ))}
</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <PostCreationModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Achievement Notification */}
      {achievementNotification && (
        <AchievementNotification
          achievement={achievementNotification}
          onClose={handleAchievementClose}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={handleCloseShareModal}
        post={shareModal.post}
      />
    </div>
  );
};

export default Social;



