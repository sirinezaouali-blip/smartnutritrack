import React from 'react';
import { FiUser, FiAward, FiBarChart2 } from 'react-icons/fi';
import styles from './UserProfileCard.module.css';

const UserProfileCard = ({ userProfile, profileStats }) => {
  if (!userProfile) return null;

  const { firstName, lastName, profile = {} } = userProfile;
  
  // Use real stats if available, otherwise use defaults
  const stats = profileStats?.stats || {
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    totalLikes: 0
  };

  const achievements = profileStats?.achievements || {
    points: 0,
    level: 1,
    badges: []
  };

  return (
    <div className={styles.profileCard}>
      {/* User Info */}
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt={`${firstName} ${lastName}`} />
          ) : (
            <div className={styles.avatarText}>
              {firstName?.charAt(0)}{lastName?.charAt(0)}
            </div>
          )}
        </div>
        <div className={styles.userDetails}>
          <h3 className={styles.userName}>
            {firstName} {lastName}
          </h3>
          {profile.bio ? (
            <p className={styles.bio}>{profile.bio}</p>
          ) : (
            <p className={styles.bioPlaceholder}>Add a bio to your profile</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsSection}>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.postsCount}</div>
          <div className={styles.statLabel}>Posts</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.followersCount}</div>
          <div className={styles.statLabel}>Followers</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.followingCount}</div>
          <div className={styles.statLabel}>Following</div>
        </div>
      </div>

      {/* Achievement Summary */}
      <div className={styles.achievementSection}>
        <div className={styles.achievementHeader}>
          <FiAward className={styles.achievementIcon} />
          <span>Achievements</span>
        </div>
        <div className={styles.achievementStats}>
          <div className={styles.achievementStat}>
            <span className={styles.achievementNumber}>{achievements.points}</span>
            <span className={styles.achievementLabel}>Points</span>
          </div>
          <div className={styles.achievementStat}>
            <span className={styles.achievementNumber}>Level {achievements.level}</span>
            <span className={styles.achievementLabel}>Level</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;