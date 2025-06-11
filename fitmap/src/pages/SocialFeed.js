import React, { useEffect } from "react";
import { useSocial } from "../contexts/SocialContext";
import SocialTabs from "../components/social/SocialTabs";
import CreatePostForm from "../components/social/CreatePostForm";
import FeedPost from "../components/social/FeedPost";
import UserSuggestions from "../components/social/UserSuggestions";
import NotificationsCenter from "../components/social/NotificationsCenter";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import styles from "./SocialFeed.module.css";
import ActivityFeed from "../components/social/ActivityFeed";
function SocialFeed() {
  const { feed, activeTab, setActiveTab } = useSocial();
  const { posts, loading, hasMore, loadMore, reload } = feed;
  const { userProfile } = useAuth();

  useEffect(() => {
    if (activeTab === 'feed') {
      reload();
    }
  }, [reload, activeTab]);

  const handleScrollLoadMore = () => {
    if (hasMore && !loading && activeTab === 'feed') {
      loadMore();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const bottomReached =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottomReached) {
        handleScrollLoadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, activeTab]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>פיד חברתי</h1>
      <SocialTabs activeTab={activeTab} onTabChange={setActiveTab} />

     {activeTab === 'feed' && (
  <>
    <CreatePostForm
      userId={userProfile?.id}
      userAvatar={userProfile?.avatar_url}
      userName={userProfile?.name}
      onPostCreated={reload}
    />
    <div className={styles.feedList}>
      {loading && posts.length === 0 ? (
        <LoadingSpinner text="טוען פיד..." />
      ) : posts.length === 0 ? (
        <p className={styles.empty}>לא נמצאו פוסטים להצגה.</p>
      ) : (
        posts.map((post) => (
          <FeedPost key={post.id} post={post} currentUserId={userProfile?.id} />
        ))
      )}
      {loading && posts.length > 0 && (
        <p className={styles.loadingMore}>טוען פוסטים נוספים...</p>
      )}
    </div>
  </>
)}

{activeTab === 'suggestions' && (
  <UserSuggestions currentUserId={userProfile?.id} />
)}

{activeTab === 'notifications' && (
  <div className={styles.notificationsWrapper}>
    <NotificationsCenter />
  </div>
)}

{activeTab === 'activities' && (
  <div className={styles.activityFeedWrapper}>
    <ActivityFeed
      title="פעילויות אחרונות"
    />
  </div>
)}

    </div>
  );
}

export default SocialFeed;
