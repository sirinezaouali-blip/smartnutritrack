import React from 'react';
import { FiX, FiCopy, FiShare2, FiMessageCircle, FiLink } from 'react-icons/fi';
import styles from './ShareModal.module.css';

const ShareModal = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/social#post-${post.id}`;
  const shareText = `Check out this post from ${post.user.name}: "${post.content.substring(0, 100)}..."`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SmartNutriTrack Post',
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleShareToFeed = () => {
    // This would create a new post sharing the original post
    alert('This would share to your feed (feature coming soon!)');
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Share Post</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.postPreview}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{post.user.avatar}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{post.user.name}</span>
              <span className={styles.postTime}>{post.timeAgo}</span>
            </div>
          </div>
          <p className={styles.postContent}>
            {post.content.substring(0, 200)}
            {post.content.length > 200 ? '...' : ''}
          </p>
        </div>

        <div className={styles.shareOptions}>
          <button className={styles.shareOption} onClick={handleNativeShare}>
            <div className={styles.optionIcon}>
              <FiShare2 />
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Share via...</span>
              <span className={styles.optionDescription}>Share with other apps</span>
            </div>
          </button>

          <button className={styles.shareOption} onClick={handleCopyLink}>
            <div className={styles.optionIcon}>
              <FiLink />
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Copy Link</span>
              <span className={styles.optionDescription}>Copy post link to clipboard</span>
            </div>
          </button>

          <button className={styles.shareOption} onClick={handleShareToFeed}>
            <div className={styles.optionIcon}>
              <FiMessageCircle />
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Share to Feed</span>
              <span className={styles.optionDescription}>Share with your followers</span>
            </div>
          </button>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;