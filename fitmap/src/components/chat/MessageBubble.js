import React, { useState } from "react";
import {
  FaCheck,
  FaCheckDouble,
  FaExclamationTriangle,
  FaDownload,
} from "react-icons/fa";
import {
  textToComponents,
  isEmojiOnlyMessage,
} from "../../utils/messageFormatter";
import styles from "./styles/MessageBubble.module.css";

function MessageBubble({
  message,
  currentUserId,
  isFirst = false,
  isLast = false,
}) {
  const [showTime, setShowTime] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!message) return null;

  const isMine = message.sender_id === currentUserId;

  const hasImage =
    message.image_url ||
    (message.content && message.content.startsWith("IMAGE:"));

  const imageUrl =
    message.image_url ||
    (message.content && message.content.startsWith("IMAGE:")
      ? message.content.substring(6).trim()
      : null);

  const isEmojiOnly = isEmojiOnlyMessage(message.content);

  const formattedTime = (() => {
    if (!message.created_at) return "";

    const date = new Date(message.created_at);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return `אתמול, ${date.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  })();

  const renderedContent = (() => {
    if (!message.content || hasImage) return null;

    const components = textToComponents(message.content);

    return (
      <div
        className={`
          ${styles.messageContent}
          ${isEmojiOnly ? styles.emojiOnlyMessage : ""}
        `}
      >
        {components.map((part, index) => {
          switch (part.type) {
            case "url":
              return (
                <a
                  key={index}
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.messageLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {part.content}
                </a>
              );
            case "hashtag":
              return (
                <span key={index} className={styles.hashtag}>
                  {part.content}
                </span>
              );
            case "mention":
              return (
                <span key={index} className={styles.mention}>
                  {part.content}
                </span>
              );
            case "emoji":
              return (
                <span
                  key={index}
                  className={`${styles.animatedEmoji} ${styles.clickable}`}
                  data-emoji={part.content}
                >
                  {part.content}
                </span>
              );

            default:
              return <span key={index}>{part.content}</span>;
          }
        })}
      </div>
    );
  })();

  const messageStatus = (() => {
    if (message.error) return "error";
    if (message.is_pending) return "pending";
    if (message.is_read) return "read";
    return "sent";
  })();

  const handleBubbleClick = () => {
    setShowTime(!showTime);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (imageUrl) window.open(imageUrl, "_blank");
  };

  return (
    <div
      className={`
        ${styles.messageContainer}
        ${isMine ? styles.currentUser : styles.otherUser}
      `}
    >
      <div
        className={`
          ${styles.messageBubble}
          ${isMine ? styles.currentUserBubble : styles.otherUserBubble}
          ${isFirst ? styles.firstInSequence : styles.notFirstInSequence}
          ${isLast ? styles.lastInSequence : ""}
          ${messageStatus === "error" ? styles.errorMessage : ""}
          ${messageStatus === "pending" ? styles.pendingMessage : ""}
          ${hasImage ? styles.imageMessage : ""}
        `}
        onClick={handleBubbleClick}
      >
        {hasImage ? (
          <div className={styles.imageContainer}>
            {!imageLoaded && !imageError && (
              <div className={styles.imageLoading}>
                <div className={styles.loadingSpinner}></div>
              </div>
            )}

            {imageError && (
              <div className={styles.imageError}>
                <FaExclamationTriangle />
                <p>שגיאה בטעינת התמונה</p>
              </div>
            )}

            <img
              src={imageUrl}
              alt="תמונה בהודעה"
              className={`${styles.messageImage} ${
                imageLoaded ? styles.loaded : ""
              }`}
              onClick={handleImageClick}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            <div className={styles.imageActions}>
              <button
                className={styles.downloadButton}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(imageUrl, "_blank");
                }}
                aria-label="הורד תמונה"
              >
                <FaDownload />
              </button>
            </div>
          </div>
        ) : (
          renderedContent
        )}

        <div
          className={`${styles.messageTime} ${showTime ? styles.visible : ""}`}
        >
          <span className={styles.timeText}>{formattedTime}</span>

          {isMine && !hasImage && (
            <span className={styles.statusIndicator}>
              {messageStatus === "read" ? (
                <FaCheckDouble className={styles.readIcon} title="נקרא" />
              ) : messageStatus === "error" ? (
                <FaExclamationTriangle
                  className={styles.errorIcon}
                  title="שגיאה בשליחה"
                />
              ) : messageStatus === "pending" ? (
                <div className={styles.pendingDot} title="נשלח" />
              ) : (
                <FaCheck className={styles.sentIcon} title="נשלח" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MessageBubble);
