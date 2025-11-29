import React, { useState, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiX, FiImage, FiCamera, FiUpload, FiTrash2, FiCheck } from 'react-icons/fi';
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
  const [uploadProgress, setUploadProgress] = useState({});

  const fileInputRef = useRef(null);

  const postTypes = [
    { id: 'progress', label: 'Progress Update', icon: '📊', description: 'Share your fitness journey' },
    { id: 'achievement', label: 'Achievement', icon: '🏆', description: 'Celebrate your milestones' },
    { id: 'meal_share', label: 'Meal Share', icon: '🍽️', description: 'Showcase your healthy meals' },
    { id: 'workout', label: 'Workout', icon: '💪', description: 'Share your exercise routine' },
    { id: 'question', label: 'Question', icon: '❓', description: 'Ask the community for advice' },
    { id: 'tip', label: 'Tip', icon: '💡', description: 'Share nutrition tips' },
    { id: 'motivation', label: 'Motivation', icon: '🔥', description: 'Inspire others' }
  ];

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setError('Please select only image files (JPEG, PNG, etc.)');
      return;
    }

    if (selectedImages.length + imageFiles.length > 4) {
      setError('Maximum 4 images allowed per post');
      return;
    }

    // Check file sizes (max 5MB each)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some images are too large. Maximum size is 5MB per image.');
      return;
    }

    setSelectedImages(prev => [...prev, ...imageFiles]);
    setError('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const uploadImages = async () => {
    const mediaUrls = [];
    
    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      try {
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [i]: Math.min(prev[i] + 10, 90) // Simulate progress up to 90%
          }));
        }, 200);

        const uploadResult = await socialService.uploadImage(image);
        clearInterval(progressInterval);
        
        setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        
        if (uploadResult.success) {
          mediaUrls.push({
            url: uploadResult.data.url,
            type: 'image',
            caption: ''
          });
        } else {
          throw new Error(uploadResult.message || 'Failed to upload image');
        }
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      }
    }
    
    return mediaUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }

    if (content.trim().length > 2000) {
      setError('Post content cannot exceed 2000 characters');
      return;
    }

    if (title.length > 200) {
      setError('Title cannot exceed 200 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload images first if any
      let mediaUrls = [];
      if (selectedImages.length > 0) {
        mediaUrls = await uploadImages();
      }

      // Create the post
      const postData = {
        type: postType,
        content: content.trim(),
        title: title.trim() || undefined,
        mediaUrls,
        visibility: 'public',
        allowComments: true,
        allowSharing: true,
        tags: getDefaultTags(postType),
        categories: getDefaultCategories(postType)
      };

      const result = await socialService.createPost(postData);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create post');
      }

      // Reset form
      setContent('');
      setTitle('');
      setSelectedImages([]);
      setPostType('progress');
      setUploadProgress({});

      // Notify parent component with formatted post data
      if (onPostCreated) {
        const formattedPost = {
          id: result.data._id,
          user: {
            id: userProfile?.id,
            name: `${userProfile?.firstName} ${userProfile?.lastName}`,
            avatar: userProfile?.social?.profilePicture || userProfile?.firstName?.charAt(0) || '👤'
          },
          content: result.data.content,
          title: result.data.title,
          type: result.data.type,
          mediaUrls: result.data.mediaUrls || [],
          likes: 0,
          comments: [],
          timeAgo: 'Just now',
          liked: false,
          allowComments: true,
          allowSharing: true
        };
        onPostCreated(formattedPost);
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultTags = (type) => {
    const tagMap = {
      progress: ['progress', 'fitness', 'journey'],
      achievement: ['achievement', 'milestone', 'success'],
      meal_share: ['food', 'nutrition', 'healthy'],
      workout: ['exercise', 'fitness', 'training'],
      question: ['question', 'help', 'advice'],
      tip: ['tip', 'advice', 'knowledge'],
      motivation: ['motivation', 'inspiration', 'positive']
    };
    return tagMap[type] || [];
  };

  const getDefaultCategories = (type) => {
    const categoryMap = {
      progress: ['fitness', 'weight_loss'],
      achievement: ['community'],
      meal_share: ['recipes', 'nutrition'],
      workout: ['fitness'],
      question: ['qna'],
      tip: ['wellness'],
      motivation: ['community']
    };
    return categoryMap[type] || [];
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setTitle('');
      setSelectedImages([]);
      setError('');
      setUploadProgress({});
      onClose();
    }
  };

  const getPostTypeDescription = () => {
    const type = postTypes.find(t => t.id === postType);
    return type ? type.description : '';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
              <div className={styles.postTypeSection}>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className={styles.postTypeSelect}
                  disabled={isSubmitting}
                >
                  {postTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <div className={styles.postTypeDescription}>
                  {getPostTypeDescription()}
                </div>
              </div>
            </div>
          </div>

          {/* Title Input (optional) */}
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Post title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
              disabled={isSubmitting}
              maxLength={200}
            />
            <div className={styles.charCount}>
              {title.length}/200
            </div>
          </div>

          {/* Content Input */}
          <div className={styles.inputGroup}>
            <textarea
              placeholder={`What's on your mind? Share your ${postTypes.find(t => t.id === postType)?.label.toLowerCase()}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.contentInput}
              rows={5}
              disabled={isSubmitting}
              required
              maxLength={2000}
            />
            <div className={styles.charCount}>
              {content.length}/2000
            </div>
          </div>

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className={styles.imagePreviewSection}>
              <h4 className={styles.imagePreviewTitle}>
                Images ({selectedImages.length}/4)
              </h4>
              <div className={styles.imagePreview}>
                {selectedImages.map((image, index) => (
                  <div key={index} className={styles.imageItem}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className={styles.previewImage}
                    />
                    <div className={styles.imageOverlay}>
                      {uploadProgress[index] !== undefined && (
                        <div className={styles.uploadProgress}>
                          {uploadProgress[index] === 100 ? (
                            <FiCheck className={styles.uploadComplete} />
                          ) : (
                            <div className={styles.progressCircle}>
                              <span>{uploadProgress[index]}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                disabled={isSubmitting || selectedImages.length >= 4}
              />
              <button
                type="button"
                className={styles.mediaButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || selectedImages.length >= 4}
              >
                <FiImage />
                {selectedImages.length >= 4 ? 'Max 4 images' : 'Add Photos'}
              </button>
              
              <button
                type="button"
                className={styles.mediaButton}
                onClick={() => {
                  // In a real app, this would open camera
                  fileInputRef.current?.click();
                }}
                disabled={isSubmitting}
              >
                <FiCamera />
                Camera
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
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner}></div>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCreationModal;