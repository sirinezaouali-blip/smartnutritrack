import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiUsers, FiHeart, FiMessageCircle, FiShare2, FiPlus, FiTrendingUp, FiImage, FiCoffee as FiUtensils, FiTarget, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import PostCreationModal from '../../components/social/PostCreationModal';
import { socialService } from '../../services/socialService';
import styles from './Social.module.css';

const Social = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [initialPostType, setInitialPostType] = useState('progress');
  const [error, setError] = useState('');
  const [followSuggestions, setFollowSuggestions] = useState([]);
  const [followingUsers, setFollowingUsers] = useState(new Set());

  useEffect(() => {
    const loadSocialData = async () => {
      setLoading(true);
      setError('');

      try {
        // Load feed from API
        const feedResponse = await socialService.getFeed();
        setPosts(feedResponse.data.posts.map(post => ({
          id: post._id,
          user: {
            id: post.userId._id,
            name: `${post.userId.firstName} ${post.userId.lastName}`,
            avatar: post.userId.social?.profilePicture || '👤'
          },
          content: post.content,
          mediaUrls: post.mediaUrls || [],
          likes: post.likes?.length || 0,
          comments: post.comments || [],
          timeAgo: new Date(post.createdAt).toLocaleString(),
          liked: post.likes?.includes(userProfile?.id) || false
        })));

        // Load follow suggestions
        const suggestionsResponse = await socialService.getFollowSuggestions(5);
        setFollowSuggestions(suggestionsResponse.data.suggestions);

        // Load following list to track who user follows
        if (userProfile?.id) {
          const followingResponse = await socialService.getFollowing(userProfile.id);
          const followingIds = new Set(followingResponse.data.following.map(user => user._id));
          setFollowingUsers(followingIds);
        }

        // Mock friends data for now - in real app, this would come from API
        setFriends([
          { id: 1, name: 'Sarah Johnson', avatar: '👩‍🍳', status: 'online' },
          { id: 2, name: 'Mike Chen', avatar: '👨‍💻', status: 'offline' },
          { id: 3, name: 'Emma Wilson', avatar: '👩‍🎨', status: 'online' },
          { id: 4, name: 'Alex Rodriguez', avatar: '👨‍⚕️', status: 'offline' },
          { id: 5, name: 'Lisa Park', avatar: '👩‍🏫', status: 'online' }
        ]);
      } catch (error) {
        console.error('Error loading social data:', error);
        setError('Failed to load social feed. Please try again.');
        // Fallback to mock data
        setPosts([
          {
            id: 1,
            user: { id: 'mock1', name: 'Sarah Johnson', avatar: '👩‍🍳' },
            content: 'Just finished meal prepping for the week! 🥗',
            mediaUrls: [],
            likes: 24,
            comments: [
              { id: 1, user: 'Mike Chen', text: 'Looks amazing!', timeAgo: '1 hour ago' },
              { id: 2, user: 'Emma Wilson', text: 'What recipe did you use?', timeAgo: '30 min ago' }
            ],
            timeAgo: '2 hours ago',
            liked: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSocialData();
  }, [userProfile?.id]);

  const handleFollowUser = async (userId) => {
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
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      // Could show a toast notification here
    }
  };

  const handleFollowSuggestion = async (userId) => {
    await handleFollowUser(userId);
    // Remove from suggestions after following
    setFollowSuggestions(prev => prev.filter(user => user._id !== userId));
  };

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <FiTrendingUp /> },
    { id: 'friends', label: 'Friends', icon: <FiUsers /> }
  ];

  const handleLike = async (postId) => {
    try {
      const result = await socialService.toggleLike(postId);
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: result.data.likesCount
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback to local state update
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1
            }
          : post
      ));
    }
  };

  const handleCommentToggle = (postId) => {
    setShowCommentInput(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const result = await socialService.addComment(postId, { text: commentText });

      // Update the post with the new comment from server
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, {
                id: result.data._id,
                user: `${result.data.userId.firstName} ${result.data.userId.lastName}`,
                text: result.data.text,
                timeAgo: 'Just now'
              }]
            }
          : post
      ));

      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      // Fallback to local state update
      const newComment = {
        id: Date.now(),
        user: userProfile?.firstName + ' ' + userProfile?.lastName || 'You',
        text: commentText,
        timeAgo: 'Just now'
      };

      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newComment]
            }
          : post
      ));

      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));
    }
  };

  const handleShare = async (post) => {
    try {
      const result = await socialService.sharePost(post.id);
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, shares: result.data.sharesCount }
          : p
      ));
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      // Fallback to native sharing
      if (navigator.share) {
        navigator.share({
          title: 'Check out this post',
          text: post.content,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(`${post.content} - Shared from SmartNutritrack`);
        alert('Post link copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading social feed..." />
      </div>
    );
  }

  return (
    <div className={styles.social}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Social</h1>
          <p className={styles.subtitle}>
            Connect with friends and share your nutrition journey
          </p>
        </div>

        <button
          className={styles.createPostButton}
          onClick={() => setShowCreatePostModal(true)}
        >
          <FiPlus />
          Create Post
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'feed' && (
          <div className={styles.feed}>
            {/* Follow Suggestions */}
            {followSuggestions.length > 0 && (
              <div className={styles.createPostCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <FiUserPlus />
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>People you might know</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {followSuggestions.map(user => (
                    <div key={user._id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        marginBottom: '8px'
                      }}>
                        {user.social?.profilePicture || user.firstName?.charAt(0) || '👤'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <button
                        onClick={() => handleFollowSuggestion(user._id)}
                        style={{
                          padding: '4px 12px',
                          background: 'var(--primary-green)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Post */}
            <div className={styles.createPostCard}>
              <div className={styles.createPostHeader}>
                <div className={styles.userAvatar}>
                  {userProfile?.firstName?.charAt(0) || '👤'}
                </div>
                <div className={styles.createPostInput}>
                  <input
                    type="text"
                    placeholder="Share your nutrition journey..."
                    className={styles.postInput}
                    onClick={() => setShowCreatePostModal(true)}
                    readOnly
                  />
                </div>
              </div>
              <div className={styles.createPostActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    setInitialPostType('progress');
                    setShowCreatePostModal(true);
                  }}
                >
                  <FiImage />
                  Photo
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    setInitialPostType('meal_share');
                    setShowCreatePostModal(true);
                  }}
                >
                  <FiUtensils />
                  Meal
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    setInitialPostType('progress');
                    setShowCreatePostModal(true);
                  }}
                >
                  <FiTarget />
                  Progress
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className={styles.posts}>
              {posts.map(post => (
                <div key={post.id} className={styles.post}>
                  <div className={styles.postHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {post.user.avatar}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{post.user.name}</div>
                        <div className={styles.postTime}>{post.timeAgo}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {post.user.id !== userProfile?.id && (
                        <button
                          onClick={() => handleFollowUser(post.user.id)}
                          style={{
                            padding: '4px 12px',
                            background: followingUsers.has(post.user.id) ? 'var(--gray-light)' : 'var(--primary-green)',
                            color: followingUsers.has(post.user.id) ? 'var(--text-secondary)' : 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {followingUsers.has(post.user.id) ? <FiUserCheck /> : <FiUserPlus />}
                          {followingUsers.has(post.user.id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                      <button className={styles.moreButton}>⋯</button>
                    </div>
                  </div>

                  <div className={styles.postContent}>
                    <p className={styles.postText}>{post.content}</p>
                  </div>

                  <div className={styles.postActions}>
                    <button
                      className={`${styles.actionButton} ${post.liked ? styles.liked : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <FiHeart />
                      {post.likes}
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleCommentToggle(post.id)}
                    >
                      <FiMessageCircle />
                      {post.comments.length}
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleShare(post)}
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
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          className={styles.commentInput}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className={styles.commentButton}
                        >
                          Post
                        </button>
                      </div>

                      <div className={styles.commentsList}>
                        {post.comments.map(comment => (
                          <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentUser}>{comment.user}</div>
                            <div className={styles.commentText}>{comment.text}</div>
                            <div className={styles.commentTime}>{comment.timeAgo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className={styles.friends}>
            <div className={styles.friendsHeader}>
              <h2 className={styles.friendsTitle}>Your Friends</h2>
              <button className={styles.findFriendsButton}>
                Find Friends
              </button>
            </div>

            <div className={styles.friendsList}>
              {friends.map(friend => (
                <div key={friend.id} className={styles.friendCard}>
                  <div className={styles.friendAvatar}>
                    {friend.avatar}
                    <div className={`${styles.statusIndicator} ${styles[friend.status]}`}></div>
                  </div>
                  <div className={styles.friendInfo}>
                    <div className={styles.friendName}>{friend.name}</div>
                    <div className={styles.friendStatus}>
                      {friend.status === 'online' ? 'Online' : 'Last seen recently'}
                    </div>
                  </div>
                  <button className={styles.messageButton}>
                    <FiMessageCircle />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Creation Modal */}
      {showCreatePostModal && (
        <PostCreationModal
          initialPostType={initialPostType}
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setShowCreatePostModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Social;
