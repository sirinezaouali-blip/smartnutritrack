import React, { useState, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiX, FiImage, FiCamera, FiUpload } from 'react-icons/fi';
import { socialService } from '../../services/socialService';
import styles from './PostCreationModal.module.css';

const PostCreationModal = ({ isOpen, onClose, onPostCreated, initialPostType = 'progress' }) => {
  const { userProfile } = useUser();
  const { t } = useLanguage();

  const [postType, setPostType] = useState(initialPostType);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const postTypes = [
    { id: 'progress', label: 'Progress Update', icon: '📊' },
    { id: 'achievement', label: 'Achievement', icon: '🏆' },
    { id: 'meal_share', label: 'Meal Share', icon: '🍽️' },
    { id: 'workout', label: 'Workout', icon: '💪' },
    { id: 'question', label: 'Question', icon: '❓' },
    { id: 'tip', label: 'Tip', icon: '💡' },
    { id: 'motivation', label: 'Motivation', icon: '🔥' }
  ];

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setError('Please select only image files');
      return;
    }

    if (selectedImages.length + imageFiles.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...imageFiles]);
    setError('');
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload images first if any
      let mediaUrls = [];
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const uploadResult = await socialService.uploadImage(image);
          mediaUrls.push({
            url: uploadResult.data.url,
            type: 'image',
            caption: ''
          });
        }
      }

      // Create the post
      const postData = {
        type: postType,
        content: content.trim(),
        title: title.trim() || undefined,
        mediaUrls,
        visibility: 'public',
        allowComments: true,
        allowSharing: true
      };

      const result = await socialService.createPost(postData);

      // Reset form
      setContent('');
      setTitle('');
      setSelectedImages([]);
      setPostType('progress');

      // Notify parent component with formatted post data
      if (onPostCreated) {
        const formattedPost = {
          id: result.data._id,
          user: {
            name: `${userProfile?.firstName} ${userProfile?.lastName}`,
            avatar: userProfile?.profilePicture || '👤'
          },
          content: result.data.content,
          mediaUrls: result.data.mediaUrls || [],
          likes: 0,
          comments: [],
          timeAgo: 'Just now',
          liked: false
        };
        onPostCreated(formattedPost);
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setTitle('');
      setSelectedImages([]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Post</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* User Info */}
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {userProfile?.firstName?.charAt(0) || '👤'}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {userProfile?.firstName} {userProfile?.lastName}
              </div>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className={styles.postTypeSelect}
              >
                {postTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title Input (optional) */}
          <input
            type="text"
            placeholder="Post title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            disabled={isSubmitting}
          />

          {/* Content Input */}
          <textarea
            placeholder="Share your nutrition journey..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.contentInput}
            rows={4}
            disabled={isSubmitting}
            required
          />

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className={styles.imagePreview}>
              {selectedImages.map((image, index) => (
                <div key={index} className={styles.imageItem}>
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={() => removeImage(index)}
                    disabled={isSubmitting}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <div className={styles.mediaButtons}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.mediaButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || selectedImages.length >= 4}
              >
                <FiImage />
                Photo
              </button>
            </div>

            <div className={styles.submitButtons}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCreationModal;
