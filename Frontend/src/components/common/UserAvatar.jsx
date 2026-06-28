/**
 * Shows the user's uploaded avatar photo, or falls back to their initials.
 * size: pixel size of the circle (default 32)
 */
export default function UserAvatar({ user, size = 32, className = "" }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";
  const fontSize = size <= 32 ? "0.75rem" : size <= 48 ? "1rem" : "1.25rem";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username || "avatar"}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "none",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
